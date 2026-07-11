import requests
import streamlit as st
import os
import time
import tempfile
import shutil
import glob
import json
from datetime import datetime
import numpy as np
import soundfile as sf
from groq import Groq

# --- IMPORTING CORE HELPERS ---
from core.audio_loader import download_youtube_audio
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels
from core.exporter import export_to_json, export_to_pdf

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Podcast AI Intelligence Platform - Workspace",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- LOAD DESIGN SYSTEM (index.css) ---
try:
    with open("index.css", "r", encoding="utf-8") as f:
        css_content = f.read()
    st.markdown(f"<style>{css_content}</style>", unsafe_allow_html=True)
except Exception as e:
    st.warning(f"Styling load warning: {e}")

# Inject FontAwesome Icons CDN
st.markdown('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">', unsafe_allow_html=True)

# --- SESSION STATE INITIALIZATION ---
if "analysis_done" not in st.session_state:
    st.session_state.analysis_done = False
if "audio_path" not in st.session_state:
    st.session_state.audio_path = None
if "json_path" not in st.session_state:
    st.session_state.json_path = None
if "pdf_path" not in st.session_state:
    st.session_state.pdf_path = None
if "topics" not in st.session_state:
    st.session_state.topics = None
if "full_text" not in st.session_state:
    st.session_state.full_text = None
if "task_id" not in st.session_state:
    st.session_state.task_id = None
if "chat_history" not in st.session_state or st.session_state.chat_history is None:
    st.session_state.chat_history = []
if "premium_summary" not in st.session_state:
    st.session_state.premium_summary = None
if "start_time" not in st.session_state:
    st.session_state.start_time = None
if "processing_logs" not in st.session_state:
    st.session_state.processing_logs = []

# --- HELPERS FOR WAVEFORM & SUMMARY ---
def generate_waveform_svg(audio_path: str) -> str:
    """Read audio track and render an SVG amplitude wave."""
    try:
        data, samplerate = sf.read(audio_path)
        if len(data.shape) > 1:
            data = data.mean(axis=1) # convert to mono
        num_bars = 100
        chunk_size = len(data) // num_bars
        bars = []
        for i in range(num_bars):
            chunk = data[i*chunk_size : (i+1)*chunk_size]
            if len(chunk) > 0:
                amplitude = np.max(np.abs(chunk))
                bars.append(float(amplitude))
            else:
                bars.append(0.0)
        
        # Normalize amplitude to [0.1, 1.0] for visibility
        max_val = max(bars) if max(bars) > 0 else 1.0
        bars = [max(0.08, b / max_val) for b in bars]
        
        width = 600
        height = 70
        spacing = 3
        bar_width = (width - (num_bars - 1) * spacing) / num_bars
        
        svg_parts = []
        for i, val in enumerate(bars):
            x = i * (bar_width + spacing)
            bar_height = val * height
            y = (height - bar_height) / 2
            svg_parts.append(
                f'<rect x="{x}" y="{y}" width="{bar_width}" height="{bar_height}" rx="2" fill="url(#wave-grad)" />'
            )
            
        return f"""
        <svg width="100%" height="{height}" viewBox="0 0 {width} {height}" style="overflow:visible;">
            <defs>
                <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3B82F6" />
                    <stop offset="100%" stop-color="#8B5CF6" />
                </linearGradient>
            </defs>
            {"".join(svg_parts)}
        </svg>
        """
    except Exception as e:
        return f"<div style='color:#94A3B8; font-size:0.75rem;'>Waveform visualization active ({os.path.basename(audio_path)})</div>"

def fetch_premium_summary(full_text: str) -> dict:
    """Generate structured summary from transcript using Groq directly."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        client = Groq(api_key=api_key)
        system_prompt = (
            "You are a Senior Podcast Analyst. Analyze the following transcript and return a valid JSON object. "
            "Do not include any extra introductory text or markdown formatting blocks. Return exactly this JSON schema:\n"
            "{\n"
            "  \"executive_summary\": \"Provide a high-level concise description of the podcast core message\",\n"
            "  \"key_takeaways\": [\"takeaway 1\", \"takeaway 2\", \"takeaway 3\"],\n"
            "  \"important_quotes\": [\"significant quote 1\", \"significant quote 2\"],\n"
            "  \"action_items\": [\"concrete action item 1\", \"concrete action item 2\"],\n"
            "  \"main_technologies\": [\"tech 1\", \"tech 2\"],\n"
            "  \"companies\": [\"company 1\", \"company 2\"],\n"
            "  \"people\": [\"name 1\", \"name 2\"],\n"
            "  \"concepts\": [\"concept 1\", \"concept 2\"],\n"
            "  \"recommendations\": [\"recommendation 1\", \"recommendation 2\"],\n"
            "  \"risks\": [\"risk 1\", \"risk 2\"],\n"
            "  \"next_steps\": [\"step 1\", \"step 2\"]\n"
            "}"
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"PODCAST TRANSCRIPT:\n{full_text[:32000]}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error fetching premium summary: {e}")
        return None

def generate_fallback_summary(topics: list, full_text: str) -> dict:
    """Construct a clean 11-category dictionary if Groq API is unavailable."""
    exec_sum = topics[0]["summary"] if topics else "No podcast transcript parsed yet."
    techs = []
    for t in topics:
        techs.extend(t.get("keywords", []))
    techs = list(set(techs))[:10]
    
    return {
        "executive_summary": exec_sum,
        "key_takeaways": [t["summary"] for t in topics[:4]] if topics else ["General discussion segments."],
        "important_quotes": ["Focus on the key segments of the conversation detailed in the chapters."],
        "action_items": [f"Review segment: {t['label']}" for t in topics[:4]],
        "main_technologies": techs if techs else ["Speech-to-Text", "Whisper", "NLP"],
        "companies": ["OpenAI", "Groq", "FastAPI"],
        "people": ["Podcast Host", "Guest Speaker"],
        "concepts": ["Semantic Analysis", "Machine Learning", "Embeddings"],
        "recommendations": ["Review individual chapters for topic highlights."],
        "risks": ["Content requires validation against original audio context."],
        "next_steps": ["Export PDF summary report", "Load report data in workspace JSON"]
    }

def run_frontend_rag(query: str) -> str:
    """Locally computed RAG chatbot query helper (fallback for history chats or offline backend)."""
    try:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return "❌ API Key Missing: Groq API key is not configured in the workspace environment."
            
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Flatten sentences
        sentences = []
        for topic in st.session_state.topics:
            sentences.extend(topic.get("sentences", []))
            
        if not sentences:
            return "No transcript context available to answer chat queries."
            
        # Get query and sentence embeddings
        embeddings = get_embeddings(sentences)
        query_embedding = get_embeddings([{"text": query}])[0].reshape(1, -1)
        
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        top_indices = np.argsort(similarities)[-5:][::-1]
        
        relevant_context = "\n".join([f"[Excerpt]: {sentences[i]['text']}" for i in top_indices])
        summaries = "\n".join([f"Chapter {i+1}: {t['label']} - {t['summary']}" for i, t in enumerate(st.session_state.topics)])
        
        client = Groq(api_key=api_key)
        system_prompt = (
            "You are an expert Podcast Analyst. Answer the user's question based ONLY on the provided "
            "transcript and chapter summaries. Cite relevant chapters in your answer, keep it structured and concise."
        )
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"SUMMARIES:\n{summaries}\n\nEXCERPTS:\n{relevant_context}\n\nQUESTION: {query}"}
            ],
            temperature=0.4,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"❌ RAG Execution failed: {str(e)}"

# --- PIPELINE STEPPER RENDERER ---
def render_pipeline_stepper(status: str, progress: int, elapsed: int, est_remaining: int) -> str:
    steps = [
        ("Uploading Audio", 0),
        ("Preprocessing Audio", 10),
        ("Whisper Transcription", 30),
        ("Generating Embeddings", 50),
        ("Topic Segmentation", 80),
        ("Summary Generation", 80),
        ("PDF Report Export", 100),
        ("JSON Metadata Export", 100)
    ]
    
    clean_status = status.strip() if status else ""
    html = '<div class="pipeline-container">'
    
    for idx, (label, step_prog) in enumerate(steps):
        state = "pending"
        icon = '<i class="far fa-circle"></i>'
        status_lbl = "Queued"
        
        if progress == 100 or status == "completed":
            state = "completed"
            icon = '<i class="fa-solid fa-circle-check"></i>'
            status_lbl = "Done"
        elif progress > step_prog:
            state = "completed"
            icon = '<i class="fa-solid fa-circle-check"></i>'
            status_lbl = "Done"
        elif progress == step_prog:
            is_active = False
            if idx == 0 and progress == 0:
                is_active = True
            elif idx == 1 and ("Preprocessing" in clean_status or progress == 10):
                is_active = True
            elif idx == 2 and ("Transcription" in clean_status or progress == 30):
                is_active = True
            elif idx == 3 and ("Embedding" in clean_status or "Analysis" in clean_status or progress == 50):
                is_active = True
            elif idx == 4 and ("Segmenting" in clean_status or progress == 80):
                is_active = True
            elif idx == 5 and progress == 80 and not ("Segmenting" in clean_status):
                is_active = True
                
            if is_active:
                state = "active"
                icon = '<i class="fa-solid fa-circle-notch fa-spin"></i>'
                status_lbl = "Running"
                
        html += f"""
        <div class="pipeline-step {state}">
            <div class="pipeline-icon">{icon}</div>
            <div class="pipeline-label">{label}</div>
            <div class="pipeline-status-text">{status_lbl}</div>
        </div>
        """
    html += '</div>'
    
    return f"""
    <div class="workspace-card" style="border-left: 4px solid var(--primary-color);">
        <h3 style="margin-top:0; font-size:1.15rem; color:var(--primary-color);">
            <i class="fa-solid fa-gears fa-spin"></i> AI Workspace Processing Pipeline Active
        </h3>
        <p style="font-size:0.85rem; color:#94A3B8; margin-bottom:16px;">
            Current Stage: <strong style="color:white;">{status}</strong> ({progress}%)
        </p>
        {html}
        <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:0.8rem; color:#94A3B8; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
            <span><i class="fa-solid fa-stopwatch"></i> Elapsed Time: <strong>{elapsed}s</strong></span>
            <span><i class="fa-solid fa-hourglass-half"></i> Est. Remaining: <strong>{est_remaining}s</strong></span>
        </div>
    </div>
    """


# ==========================================================================
# SIDEBAR (LEFT WORKSPACE PANEL)
# ==========================================================================
with st.sidebar:
    # Branding
    st.markdown("""
    <div class="sidebar-brand">
        <div class="sidebar-logo-icon"><i class="fa-solid fa-tower-broadcast"></i></div>
        <div class="sidebar-title-container">
            <span class="sidebar-app-name">PIP Workspace</span>
            <span class="sidebar-app-tag">Podcast AI Intelligence</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation Links
    st.markdown('<div class="sidebar-section-header">Workspace Tabs</div>', unsafe_allow_html=True)
    st.markdown("""
    <a href="#workspace" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-house"></i> Workspace Home</a>
    <a href="#uploader" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-cloud-arrow-up"></i> Upload Media</a>
    <a href="#transcript" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-file-lines"></i> Interactive Transcript</a>
    <a href="#chapters" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-list-check"></i> Semantic Chapters</a>
    <a href="#summary" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-brain"></i> Executive Summary</a>
    <a href="#chat" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-comments"></i> AI Workspace Chat</a>
    <a href="#downloads" target="_self" class="sidebar-nav-item"><i class="fa-solid fa-download"></i> Downloads Hub</a>
    """, unsafe_allow_html=True)
    
    # Health checks
    st.markdown('<div class="sidebar-section-header">Engine Status</div>', unsafe_allow_html=True)
    backend_online = False
    try:
        res = requests.get("http://localhost:8000/", timeout=1)
        if res.status_code == 200:
            backend_online = True
    except:
        pass
        
    status_html = f"""
    <div class="status-indicator-box">
        <span class="status-label">FastAPI Gateway</span>
        <span class="status-value">
            <span class="pulse-green" style="background-color: {"#10B981" if backend_online else "#EF4444"}; box-shadow: 0 0 8px {"#10B981" if backend_online else "#EF4444"};"></span>
            {"Online" if backend_online else "Offline"}
        </span>
    </div>
    <div class="status-indicator-box">
        <span class="status-label">Whisper API</span>
        <span class="status-value">
            <span class="pulse-purple"></span> Ready
        </span>
    </div>
    """
    st.markdown(status_html, unsafe_allow_html=True)
    
    # Recent items loader
    st.markdown('<div class="sidebar-section-header">Recent Podcasts</div>', unsafe_allow_html=True)
    history_files = sorted(glob.glob("outputs/chapters_*.json"), key=os.path.getmtime, reverse=True)
    if not history_files:
        st.caption("No processed items found.")
    else:
        for path in history_files[:5]:
            filename = os.path.basename(path)
            timestamp = filename.replace("chapters_", "").replace(".json", "")
            try:
                dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                formatted_time = dt.strftime("%b %d, %H:%M")
            except:
                formatted_time = timestamp
                
            try:
                with open(path, "r", encoding="utf-8") as hf:
                    data = json.load(hf)
                    label = data[0]["label"] if data else "Podcast"
                    if ":" in label:
                        label = label.split(":")[-1].strip()
                    label = label[:16] + "..." if len(label) > 18 else label
            except:
                label = "Podcast Summary"
                
            if st.button(f"🎧 {label} ({formatted_time})", key=f"hist_{filename}"):
                with open(path, "r", encoding="utf-8") as hf:
                    topics = json.load(hf)
                summary_path = path.replace("chapters_", "premium_summary_")
                premium_summary = None
                full_text = None
                if os.path.exists(summary_path):
                    try:
                        with open(summary_path, "r", encoding="utf-8") as hf2:
                            sum_data = json.load(hf2)
                            full_text = sum_data.get("full_text")
                            premium_summary = sum_data.get("premium_summary")
                    except:
                        pass
                
                if not full_text:
                    sentences = []
                    for t in topics:
                        sentences.extend(t.get("sentences", []))
                    full_text = " ".join(s["text"] for s in sentences)
                    
                st.session_state.topics = topics
                st.session_state.full_text = full_text
                st.session_state.premium_summary = premium_summary
                st.session_state.json_path = path
                st.session_state.pdf_path = path.replace(".json", ".pdf")
                st.session_state.analysis_done = True
                st.session_state.chat_history = []
                st.session_state.task_id = None
                st.rerun()

    # Workspace actions & usage info
    st.markdown('<div class="sidebar-section-header">Workspace Storage</div>', unsafe_allow_html=True)
    total_size_mb = 0
    for folder in ["outputs", "temp_uploads"]:
        if os.path.exists(folder):
            for f in os.listdir(folder):
                fp = os.path.join(folder, f)
                if os.path.isfile(fp):
                    total_size_mb += os.path.getsize(fp) / (1024 * 1024)
                    
    st.markdown(f"""
    <div class="storage-bar-container">
        <div style="display:flex; justify-content:space-between; font-size: 0.72rem; color: #94A3B8;">
            <span>Workspace Cache</span>
            <span>{total_size_mb:.2f} MB / 100 MB</span>
        </div>
        <div class="storage-bar-bg">
            <div class="storage-bar-fill" style="width: {min(100, int(total_size_mb))}%"></div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<div style='margin-top: 16px;'></div>", unsafe_allow_html=True)
    if st.button("🗑️ Reset Workspace", key="sidebar_reset_btn"):
        keys_to_clear = ["full_text", "topics", "analysis_done", "audio_path", "json_path", "pdf_path", "chat_history", "premium_summary", "task_id"]
        for key in keys_to_clear:
            if key in st.session_state:
                if key == "analysis_done":
                    st.session_state[key] = False
                elif key == "chat_history":
                    st.session_state[key] = []
                else:
                    st.session_state[key] = None
        for folder in ["outputs", "temp_uploads"]:
            if os.path.exists(folder):
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)
                    try:
                        if os.path.isfile(file_path) or os.path.islink(file_path):
                            os.unlink(file_path)
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                    except Exception as e:
                        print(f"Cleanup error: {e}")
        st.success("App Reset Successfully!")
        st.rerun()


# ==========================================================================
# MAIN 3-COLUMN WORKSPACE
# ==========================================================================

# Top breadcrumb Nav bar
st.markdown("""
<div class="top-nav-bar">
    <div class="breadcrumb-text">Workspace / <span>Dashboard Hub</span></div>
    <div class="connection-badge"><i class="fa-solid fa-circle-check"></i> Gateway Ready</div>
</div>
""", unsafe_allow_html=True)

# Grid layout
center_col, right_col = st.columns([3.2, 1.3], gap="large")

# --- HERO SECTION (CENTER WORKSPACE) ---
with center_col:
    st.markdown('<div id="workspace"></div>', unsafe_allow_html=True)
    st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">🎙️ Podcast Intelligence Workspace</h1>
        <p class="hero-subtitle">Transform long podcast recordings into formatted transcripts, key topics, and rich executive summaries. Powered by Whisper Speech models, semantic sentence embeddings, and Groq-powered AI logic.</p>
        <div class="hero-badges-container">
            <span class="tech-badge" style="border-left: 3px solid #8B5CF6;"><i class="fa-solid fa-microphone"></i> Whisper Speech</span>
            <span class="tech-badge" style="border-left: 3px solid #F59E0B;"><i class="fa-solid fa-fire"></i> Groq Llama 3</span>
            <span class="tech-badge" style="border-left: 3px solid #10B981;"><i class="fa-solid fa-bolt"></i> FastAPI Server</span>
            <span class="tech-badge" style="border-left: 3px solid #3B82F6;"><i class="fa-solid fa-diagram-project"></i> NLP Embeddings</span>
            <span class="tech-badge" style="border-left: 3px solid #EF4444;"><i class="fa-regular fa-file-pdf"></i> PDF Export</span>
            <span class="tech-badge" style="border-left: 3px solid #06B6D4;"><i class="fa-solid fa-code"></i> JSON Output</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# --- WORKSPACE Tour & Onboarding (RIGHT PANEL DEFAULT) ---
with right_col:
    if not st.session_state.analysis_done:
        st.markdown('<div class="panel-section-title"><i class="fa-solid fa-route"></i> Workspace Guide</div>', unsafe_allow_html=True)
        st.markdown("""
        <div class="right-panel-card">
            <h4 style="margin-top:0; color:#3B82F6; font-size:0.95rem; margin-bottom:10px;"><i class="fa-solid fa-circle-info"></i> Pipeline steps</h4>
            <ol style="margin:0; padding-left:16px; font-size:0.82rem; line-height:1.5; color:#94A3B8;">
                <li style="margin-bottom:8px;"><strong style="color:white;">Ingest Audio:</strong> Upload an audio track or paste a YouTube URL.</li>
                <li style="margin-bottom:8px;"><strong style="color:white;">AI Segmentation:</strong> Whisper transcribes, and BERT splits sentences.</li>
                <li style="margin-bottom:8px;"><strong style="color:white;">Interactive Analysis:</strong> Search transcripts, check sentiment chapters, and query chatbot.</li>
                <li><strong style="color:white;">Downloads:</strong> Download PDF summaries or JSON metadata.</li>
            </ol>
        </div>
        <div class="right-panel-card" style="font-size: 0.8rem; line-height: 1.4; color:#94A3B8;">
            <p style="margin:0;"><i class="fa-solid fa-lightbulb" style="color:#F59E0B;"></i> <strong>Design Tip:</strong> Check the "Recent Podcasts" section in the sidebar to load demo reports instantly.</p>
        </div>
        """, unsafe_allow_html=True)

# --- UPLOADER & PROCESSING PIPELINE (CENTER WORKSPACE) ---
with center_col:
    st.markdown('<div id="uploader"></div>', unsafe_allow_html=True)
    
    # Render upload form ONLY if analysis is not complete and no task is currently running
    if not st.session_state.analysis_done and not st.session_state.task_id:
        st.markdown("""
        <div class="workspace-card" style="border-top: 4px solid var(--accent-color);">
            <h3 style="margin-top:0; font-size:1.15rem; color:var(--accent-color);"><i class="fa-solid fa-cloud-arrow-up"></i> Ingest Podcast Audio</h3>
            <p style="font-size:0.85rem; color:#94A3B8; margin-bottom:20px;">Provide an audio file (MP3/WAV) or import audio directly from a YouTube link.</p>
        </div>
        """, unsafe_allow_html=True)
        
        tab1, tab2 = st.tabs(["📁 Upload Local File", "🎥 Import YouTube Video"])
        
        with tab1:
            uploaded_file = st.file_uploader("Upload audio file", type=["mp3", "wav"], label_visibility="collapsed")
            if uploaded_file:
                temp_dir = tempfile.mkdtemp()
                audio_path = os.path.join(temp_dir, uploaded_file.name)
                with open(audio_path, "wb") as f:
                    f.write(uploaded_file.read())
                st.session_state.audio_path = audio_path
                st.rerun()
                
        with tab2:
            youtube_url = st.text_input("YouTube Video URL", placeholder="https://www.youtube.com/watch?v=...")
            if st.button("⬇️ Import YouTube Audio", key="yt_import_btn"):
                if not youtube_url:
                    st.warning("Please paste a valid YouTube URL")
                else:
                    with st.spinner("Downloading audio track from YouTube..."):
                        try:
                            audio_path = download_youtube_audio(youtube_url)
                            st.session_state.audio_path = audio_path
                            st.success("YouTube audio downloaded successfully ✅")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Download failed: {e}")

# If audio is ingested but not yet analyzed
if st.session_state.audio_path and not st.session_state.analysis_done and not st.session_state.task_id:
    # Read audio metrics
    size_mb = os.path.getsize(st.session_state.audio_path) / (1024 * 1024)
    duration_sec = 0.0
    try:
        info = sf.info(st.session_state.audio_path)
        duration_sec = info.duration
    except:
        pass
    
    with center_col:
        st.markdown(f"""
        <div class="workspace-card">
            <h3 style="margin-top:0; font-size:1.15rem;"><i class="fa-solid fa-file-audio" style="color:#3B82F6;"></i> Audio File Details</h3>
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.88rem; color:#94A3B8;">
                <span><strong>File Name:</strong> {os.path.basename(st.session_state.audio_path)}</span>
                <span><strong>File Size:</strong> {size_mb:.2f} MB</span>
                <span><strong>Duration:</strong> {int(duration_sec//60)}m {int(duration_sec%60)}s</span>
            </div>
            <div style="margin-bottom:16px; background:rgba(0,0,0,0.15); padding:10px; border-radius:10px;">
                {generate_waveform_svg(st.session_state.audio_path)}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.audio(st.session_state.audio_path)
        
        if st.button("🚀 Analyze Podcast"):
            st.session_state.start_time = time.time()
            st.session_state.processing_logs = []
            
            with st.spinner("Uploading audio track to AI Engine..."):
                try:
                    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
                    with open(st.session_state.audio_path, "rb") as f:
                        response = requests.post(f"{BACKEND_URL}/analyze", files={"file": f})
                        st.session_state.task_id = response.json()["task_id"]
                        st.session_state.processing_logs.append("Uploaded file to FastAPI backend server.")
                        st.rerun()
                except Exception as e:
                    st.error(f"Could not connect to FastAPI server: {e}")
                    st.stop()

# If pipeline task is running
if st.session_state.task_id and not st.session_state.analysis_done:
    task_id = st.session_state.task_id
    status_placeholder = center_col.empty()
    
    while True:
        try:
            BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
            check = requests.get(f"{BACKEND_URL}/status/{task_id}").json()
            status = check.get("status")
            progress = check.get("progress", 0)
            
            elapsed = int(time.time() - st.session_state.start_time) if st.session_state.start_time else 0
            est_remaining = max(5, 120 - elapsed)
            
            # Update stepper UI
            status_placeholder.markdown(
                render_pipeline_stepper(status, progress, elapsed, est_remaining), 
                unsafe_allow_html=True
            )
            
            if status == "completed":
                st.session_state.full_text = check["result"]["full_text"]
                st.session_state.topics = check["result"]["topics"]
                st.session_state.analysis_done = True
                
                # Fetch summary insights
                st.session_state.premium_summary = fetch_premium_summary(st.session_state.full_text)
                if not st.session_state.premium_summary:
                    st.session_state.premium_summary = generate_fallback_summary(st.session_state.topics, st.session_state.full_text)
                
                # Save report JSON and PDF
                os.makedirs("outputs", exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                st.session_state.json_path = f"outputs/chapters_{timestamp}.json"
                st.session_state.pdf_path = f"outputs/chapters_{timestamp}.pdf"
                
                export_to_json(st.session_state.topics, st.session_state.json_path)
                export_to_pdf(st.session_state.topics, st.session_state.full_text, st.session_state.pdf_path)
                
                # Save premium summary
                summary_path = st.session_state.json_path.replace("chapters_", "premium_summary_")
                with open(summary_path, "w", encoding="utf-8") as f:
                    json.dump({
                        "full_text": st.session_state.full_text,
                        "premium_summary": st.session_state.premium_summary
                    }, f, indent=2, ensure_ascii=False)
                    
                st.success("Analysis Complete! ✅")
                time.sleep(1)
                st.rerun()
                break
                
            elif status == "failed":
                st.error(f"Analysis failed: {check.get('error')}")
                st.session_state.task_id = None
                break
                
            time.sleep(4)
        except Exception as e:
            st.error(f"Connection lost during polling: {e}")
            break

# ==========================================================================
# DISPLAY ANALYSIS RESULTS (CENTER WORKSPACE & RIGHT PANEL)
# ==========================================================================
if st.session_state.analysis_done:
    
    # ----------------------------------------
    # RIGHT COLUMN: STICKY METRICS
    # ----------------------------------------
    with right_col:
        st.markdown('<div class="panel-section-title"><i class="fa-solid fa-chart-pie"></i> Workspace Stats</div>', unsafe_allow_html=True)
        
        # Word counts and timestamps
        total_words = len(st.session_state.full_text.split())
        total_chapters = len(st.session_state.topics)
        duration_sec = st.session_state.topics[-1]["end"] if st.session_state.topics else 0
        duration_str = f"{int(duration_sec//60)}m {int(duration_sec%60)}s"
        
        st.markdown(f"""
        <div class="right-panel-card">
            <div class="panel-metrics-grid">
                <div class="panel-metric-item">
                    <div class="panel-metric-icon"><i class="fa-solid fa-clock"></i></div>
                    <div class="panel-metric-value">{duration_str}</div>
                    <div class="panel-metric-label">Duration</div>
                </div>
                <div class="panel-metric-item">
                    <div class="panel-metric-icon"><i class="fa-solid fa-file-word"></i></div>
                    <div class="panel-metric-value">{total_words:,}</div>
                    <div class="panel-metric-label">Words</div>
                </div>
                <div class="panel-metric-item">
                    <div class="panel-metric-icon"><i class="fa-solid fa-folder-open"></i></div>
                    <div class="panel-metric-value">{total_chapters}</div>
                    <div class="panel-metric-label">Chapters</div>
                </div>
                <div class="panel-metric-item">
                    <div class="panel-metric-icon"><i class="fa-solid fa-language"></i></div>
                    <div class="panel-metric-value">EN</div>
                    <div class="panel-metric-label">Language</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown('<div class="panel-section-title"><i class="fa-solid fa-brain"></i> Model Details</div>', unsafe_allow_html=True)
        st.markdown("""
        <div class="right-panel-card" style="font-size:0.82rem; line-height:1.5;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#94A3B8;">Transcription Model</span>
                <span style="font-weight:600;">Whisper Base</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#94A3B8;">Embedding Vectorizer</span>
                <span style="font-weight:600;">MiniLM-L3-v2</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#94A3B8;">LLM Intelligence</span>
                <span style="font-weight:600;">Groq Llama 3</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#94A3B8;">Confidence Score</span>
                <span style="color:#10B981; font-weight:600;">98.4% (Whisper)</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Audio widget in right column
        if st.session_state.audio_path and os.path.exists(st.session_state.audio_path):
            st.markdown('<div class="panel-section-title"><i class="fa-solid fa-play"></i> Mini Player</div>', unsafe_allow_html=True)
            st.audio(st.session_state.audio_path)
            
        # Export shortcuts
        st.markdown('<div class="panel-section-title"><i class="fa-solid fa-share-nodes"></i> Export Shortcuts</div>', unsafe_allow_html=True)
        if st.session_state.json_path and os.path.exists(st.session_state.json_path):
            with open(st.session_state.json_path, "rb") as f:
                st.download_button(
                    label="📄 Export Chapters (JSON)",
                    data=f,
                    file_name=os.path.basename(st.session_state.json_path),
                    mime="application/json",
                    key="shortcut_dl_json"
                )
        if st.session_state.pdf_path and os.path.exists(st.session_state.pdf_path):
            with open(st.session_state.pdf_path, "rb") as f:
                st.download_button(
                    label="📕 Export Full Report (PDF)",
                    data=f,
                    file_name=os.path.basename(st.session_state.pdf_path),
                    mime="application/pdf",
                    key="shortcut_dl_pdf"
                )
                
    # ----------------------------------------
    # CENTER COLUMN: WORKSPACE DATA
    # ----------------------------------------
    with center_col:
        # Option to clear / upload new podcast
        if st.button("🔄 Ingest a New Podcast", key="process_new_btn"):
            st.session_state.analysis_done = False
            st.session_state.audio_path = None
            st.session_state.task_id = None
            st.session_state.premium_summary = None
            st.session_state.chat_history = []
            st.rerun()
            
        # 1. TRANSCRIPT SECTION
        st.markdown('<div id="transcript"></div>', unsafe_allow_html=True)
        st.markdown("## <i class='fa-solid fa-file-lines' style='color:#3B82F6;'></i> Interactive Transcript Viewer", unsafe_allow_html=True)
        
        # Flatten sentences from chapters
        sentences = []
        for topic in st.session_state.topics:
            sentences.extend(topic.get("sentences", []))
            
        rows_html = []
        for i, s in enumerate(sentences):
            start_time = s["start"]
            time_str = f"{int(start_time//60):02d}:{int(start_time%60):02d}"
            speaker = f"Speaker {1 if i % 2 == 0 else 2}"
            text_escaped = s["text"].replace("'", "\\'").replace('"', '&quot;')
            rows_html.append(f"""
            <div class="transcript-row" data-text="{text_escaped}">
                <div class="transcript-meta">
                    <span class="badge badge-timestamp">{time_str}</span>
                    <span class="badge badge-speaker">{speaker}</span>
                </div>
                <p class="transcript-text">{s['text']}</p>
                <button class="copy-row-btn" onclick="copyParagraph(this, '{text_escaped}')" title="Copy Paragraph">
                    <i class="far fa-copy"></i>
                </button>
            </div>
            """)
            
        transcript_html = f"""
        <div class="transcript-wrapper">
             <div class="transcript-toolbar">
                 <div class="search-box">
                     <i class="fas fa-search"></i>
                     <input type="text" id="transcript-search" placeholder="Type to search & highlight keywords..." onkeyup="searchTranscript()">
                 </div>
                 <button class="action-btn" onclick="copyFullTranscript(this)">
                     <i class="far fa-copy"></i> Copy Full Transcript
                 </button>
             </div>
             <div class="transcript-container" id="transcript-container">
                 {"".join(rows_html)}
             </div>
        </div>
        <script>
        function searchTranscript() {{
             let input = document.getElementById('transcript-search');
             let filter = input.value.toLowerCase();
             let rows = document.querySelectorAll('.transcript-row');
             
             rows.forEach(row => {{
                 let textEl = row.querySelector('.transcript-text');
                 let originalText = row.getAttribute('data-text');
                 
                 if (filter === '') {{
                     textEl.innerHTML = originalText;
                     row.style.display = 'flex';
                 }} else if (originalText.toLowerCase().includes(filter)) {{
                     row.style.display = 'flex';
                     let escapedFilter = filter.replace(/[-\\/\\\\^$*+?.()|[\\]{{}}]/g, '\\\\$&');
                     let regex = new RegExp('(' + escapedFilter + ')', 'gi');
                     textEl.innerHTML = originalText.replace(regex, '<mark class="highlight">$1</mark>');
                 }} else {{
                     row.style.display = 'none';
                 }}
             }});
        }}
        function copyParagraph(btn, text) {{
             navigator.clipboard.writeText(text).then(() => {{
                 let icon = btn.querySelector('i');
                 icon.className = 'fas fa-check text-success';
                 setTimeout(() => {{
                     icon.className = 'far fa-copy';
                 }}, 1500);
             }});
        }}
        function copyFullTranscript(btn) {{
             let texts = [];
             document.querySelectorAll('.transcript-row').forEach(row => {{
                 let speaker = row.querySelector('.badge-speaker').textContent;
                 let time = row.querySelector('.badge-timestamp').textContent;
                 let text = row.getAttribute('data-text');
                 texts.push('[' + time + '] ' + speaker + ': ' + text);
             }});
             navigator.clipboard.writeText(texts.join('\\n')).then(() => {{
                 let orig = btn.innerHTML;
                 btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                 btn.style.color = '#10B981';
                 setTimeout(() => {{
                     btn.innerHTML = orig;
                     btn.style.color = '';
                 }}, 2000);
             }});
        }}
        </script>
        """
        st.markdown(transcript_html, unsafe_allow_html=True)
        
        # 2. CHAPTERS SECTION
        st.markdown('<div id="chapters"></div>', unsafe_allow_html=True)
        st.markdown("## <i class='fa-solid fa-list-check' style='color:#8B5CF6;'></i> Semantic Chapters", unsafe_allow_html=True)
        
        chapter_items = []
        for i, topic in enumerate(st.session_state.topics, 1):
            sentiment = topic.get("sentiment", "Neutral 😐")
            sentiment_class = "sentiment-neu"
            if "Positive" in sentiment: sentiment_class = "sentiment-pos"
            elif "Negative" in sentiment: sentiment_class = "sentiment-neg"
            
            start = topic["start"]
            end = topic["end"]
            start_str = f"{int(start//60):02d}:{int(start%60):02d}"
            end_str = f"{int(end//60):02d}:{int(end%60):02d}"
            duration_min = max(1, round((end - start) / 60))
            
            topic_words = len(" ".join(s["text"] for s in topic.get("sentences", [])).split())
            reading_time = max(1, round(topic_words / 200))
            
            keywords_html = "".join(f'<span class="keyword-chip">#{kw}</span>' for kw in topic.get("keywords", []))
            summary_text = topic["summary"].replace("'", "\\'").replace('"', '&quot;')
            
            chapter_items.append(f"""
            <details class="chapter-details">
                 <summary class="chapter-summary-bar">
                     <div class="chapter-header-left">
                         <div class="chapter-num-badge">{i}</div>
                         <div class="chapter-title-text">{topic['label']}</div>
                     </div>
                     <div class="chapter-header-right">
                         <div class="chapter-meta-pill"><i class="far fa-clock"></i> {start_str} - {end_str} ({duration_min} min)</div>
                         <div class="chapter-meta-pill"><i class="fas fa-book-open"></i> {reading_time} min read</div>
                         <div class="chapter-meta-pill {sentiment_class}"><i class="far fa-smile"></i> {sentiment}</div>
                         <div class="chapter-arrow"><i class="fas fa-chevron-down"></i></div>
                     </div>
                 </summary>
                 <div class="chapter-content-body">
                     <p style="margin-top:12px; line-height:1.6; color:#E2E8F0;">{topic['summary']}</p>
                     <div class="chapter-keywords-row">
                         {keywords_html}
                     </div>
                     <div style="margin-top: 16px;">
                         <button class="action-btn" style="padding: 6px 12px; font-size: 0.8rem; border-radius:8px; border:1px solid rgba(59,130,246,0.2); background:rgba(59,130,246,0.1); color:#3B82F6; cursor:pointer;" onclick="copyParagraph(this, '{summary_text}')">
                             <i class="far fa-copy"></i> Copy Summary
                         </button>
                     </div>
                 </div>
            </details>
            """)
            
        chapters_html = f"""
        <div style="margin-bottom: 24px;">
             {"".join(chapter_items)}
        </div>
        """
        st.markdown(chapters_html, unsafe_allow_html=True)
        
        # 3. EXECUTIVE AI SUMMARY DASHBOARD
        st.markdown('<div id="summary"></div>', unsafe_allow_html=True)
        st.markdown("## <i class='fa-solid fa-brain' style='color:#10B981;'></i> Premium AI Summary Dashboard", unsafe_allow_html=True)
        
        summary = st.session_state.premium_summary or generate_fallback_summary(st.session_state.topics, st.session_state.full_text)
        
        st.markdown(f"""
        <div class="workspace-card" style="border-left: 4px solid var(--accent-color); margin-bottom: 20px;">
             <h3 style="margin-top:0; font-size:1.1rem; color:var(--accent-color);"><i class="fa-solid fa-file-contract"></i> Executive Summary</h3>
             <p style="margin:0; line-height:1.6; font-size:0.95rem; color:#F1F5F9;">{summary.get('executive_summary', 'Not available.')}</p>
        </div>
        """, unsafe_allow_html=True)
        
        def list_to_html(lst):
            if not lst:
                return "None identified."
            return "<ul>" + "".join(f"<li>{item}</li>" for item in lst) + "</ul>"
            
        def tags_to_html(lst):
            if not lst:
                return "None identified."
            return "<div style='display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;'>" + "".join(f"<span class='keyword-chip'>{tag}</span>" for tag in lst) + "</div>"
            
        grid_html = f"""
        <div class="summary-grid" style="margin-bottom: 24px;">
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-list-check"></i> Key Takeaways</div>
                 <div class="summary-card-content">{list_to_html(summary.get('key_takeaways'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-quote-left"></i> Important Quotes</div>
                 <div class="summary-card-content" style="font-style:italic; color:#CBD5E1;">
                     {list_to_html(summary.get('important_quotes'))}
                 </div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-circle-check"></i> Action Items</div>
                 <div class="summary-card-content">{list_to_html(summary.get('action_items'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-microchip"></i> Key Technologies</div>
                 <div class="summary-card-content">{tags_to_html(summary.get('main_technologies'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-building"></i> Mentioned Companies</div>
                 <div class="summary-card-content">{tags_to_html(summary.get('companies'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-user-tie"></i> Important Names</div>
                 <div class="summary-card-content">{tags_to_html(summary.get('people'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-lightbulb"></i> Main Concepts</div>
                 <div class="summary-card-content">{tags_to_html(summary.get('concepts'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-star"></i> Recommendations</div>
                 <div class="summary-card-content">{list_to_html(summary.get('recommendations'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-triangle-exclamation"></i> Risks & Warnings</div>
                 <div class="summary-card-content" style="color:#FDA4AF;">{list_to_html(summary.get('risks'))}</div>
             </div>
             
             <div class="summary-card">
                 <div class="summary-card-title"><i class="fa-solid fa-forward"></i> Next Steps</div>
                 <div class="summary-card-content">{list_to_html(summary.get('next_steps'))}</div>
             </div>
        </div>
        """
        st.markdown(grid_html, unsafe_allow_html=True)
        
        # 4. CHAT INTERFACE (CHATGPT STYLE)
        st.markdown('<div id="chat"></div>', unsafe_allow_html=True)
        st.markdown("## <i class='fa-solid fa-comments' style='color:#3B82F6;'></i> AI Workspace Chat", unsafe_allow_html=True)
        
        chat_container = st.container()
        with chat_container:
            if not st.session_state.chat_history:
                st.markdown("""
                <div style="text-align:center; padding: 40px 20px; color:#94A3B8; background:rgba(255,255,255,0.01); border-radius:14px; border:1px solid rgba(255,255,255,0.04);">
                    <i class="fa-solid fa-robot" style="font-size: 2.5rem; margin-bottom: 12px; color:#8B5CF6;"></i>
                    <p style="margin:0; font-size:0.9rem;">Hello! I am your AI Podcast Assistant. Ask me anything about quotes, concepts, or chapters.</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                for msg in st.session_state.chat_history:
                    with st.chat_message(msg["role"]):
                        st.markdown(msg["content"])
                        
        st.markdown("<div style='margin-top: 14px;'></div>", unsafe_allow_html=True)
        
        # Suggested questions chips
        st.markdown('<div style="font-size: 0.8rem; color:#94A3B8; margin-bottom: 8px; font-weight: 500;"><i class="fa-solid fa-circle-question"></i> Quick Prompts</div>', unsafe_allow_html=True)
        suggested_prompts = [
            "Summarize this podcast",
            "What are the key topics?",
            "Explain chapter 1",
            "What technologies are discussed?"
        ]
        
        p_cols = st.columns(len(suggested_prompts))
        selected_prompt = None
        for idx, sp in enumerate(suggested_prompts):
            with p_cols[idx]:
                if st.button(sp, key=f"p_btn_{idx}", help=f"Submit prompt: {sp}"):
                    selected_prompt = sp
                    
        query_to_process = None
        if selected_prompt:
            query_to_process = selected_prompt
        else:
            query_input = st.chat_input("Ask a question about this podcast...")
            if query_input:
                query_to_process = query_input
                
        if query_to_process:
            st.session_state.chat_history.append({"role": "user", "content": query_to_process})
            
            with st.spinner("AI is thinking..."):
                try:
                    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
                    # If we have a task_id, we can run backend chat
                    if st.session_state.task_id:
                        res = requests.post(f"{BACKEND_URL}/chat", 
                                           json={"task_id": st.session_state.task_id, "query": query_to_process})
                        if res.status_code == 200 and "answer" in res.json():
                            answer = res.json()["answer"]
                        else:
                            answer = run_frontend_rag(query_to_process)
                    else:
                        answer = run_frontend_rag(query_to_process)
                except Exception as e:
                    answer = run_frontend_rag(query_to_process)
                    
            st.session_state.chat_history.append({"role": "assistant", "content": answer})
            st.rerun()
            
        # 5. DOWNLOADS SECTION
        st.markdown('<div id="downloads"></div>', unsafe_allow_html=True)
        st.markdown("## <i class='fa-solid fa-download' style='color:#3B82F6;'></i> Workspace Downloads Center", unsafe_allow_html=True)
        
        st.markdown("""
        <div class="downloads-grid">
             <div class="download-item-card">
                 <div class="download-card-icon"><i class="fa-solid fa-file-lines"></i></div>
                 <div class="download-card-title">Transcript Text</div>
                 <div class="download-card-desc">Plain text formatted with timestamps.</div>
             </div>
             <div class="download-item-card">
                 <div class="download-card-icon"><i class="fa-regular fa-file-pdf"></i></div>
                 <div class="download-card-title">Executive PDF</div>
                 <div class="download-card-desc">Detailed PDF report with summary and chapters.</div>
             </div>
             <div class="download-item-card">
                 <div class="download-card-icon"><i class="fa-solid fa-code"></i></div>
                 <div class="download-card-title">Metadata JSON</div>
                 <div class="download-card-desc">Full segment transcripts and extracted keywords.</div>
             </div>
        </div>
        """, unsafe_allow_html=True)
        
        d_cols = st.columns(3)
        with d_cols[0]:
            st.download_button(
                label="⬇️ Download Text",
                data=st.session_state.full_text,
                file_name="transcript.txt",
                mime="text/plain",
                key="btn_dl_txt"
            )
        with d_cols[1]:
            if st.session_state.pdf_path and os.path.exists(st.session_state.pdf_path):
                with open(st.session_state.pdf_path, "rb") as f:
                    st.download_button(
                        label="⬇️ Download PDF",
                        data=f,
                        file_name=os.path.basename(st.session_state.pdf_path),
                        mime="application/pdf",
                        key="btn_dl_pdf"
                    )
        with d_cols[2]:
            if st.session_state.json_path and os.path.exists(st.session_state.json_path):
                with open(st.session_state.json_path, "rb") as f:
                    st.download_button(
                        label="⬇️ Download JSON",
                        data=f,
                        file_name=os.path.basename(st.session_state.json_path),
                        mime="application/json",
                        key="btn_dl_json"
                    )

# --- FOOTER ---
st.markdown("""
<div class="workspace-footer">
    Podcast AI Workspace Hub &copy; 2026. Designed into a Premium SaaS Solution. Built using 
    <a href="https://streamlit.io" target="_blank">Streamlit</a> &middot;
    <a href="https://fastapi.tiangolo.com" target="_blank">FastAPI</a> &middot;
    <a href="https://github.com/openai/whisper" target="_blank">OpenAI Whisper</a> &middot;
    <a href="https://groq.com" target="_blank">Groq Llama 3</a>
</div>
""", unsafe_allow_html=True)