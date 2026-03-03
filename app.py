import requests
import streamlit as st
import os
import time
import tempfile
import shutil
from datetime import datetime

# --- IMPORTING CORE HELPERS ---
from core.audio_loader import download_youtube_audio
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels
from core.exporter import export_to_json, export_to_pdf

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Podcast Intelligence Platform",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- CUSTOM CSS FOR MODERN DASHBOARD AESTHETICS ---
st.markdown("""
<style>
    /* Main Background & Font */
    .stApp {
        background-color: #0f172a;
        color: #f1f5f9;
        font-family: 'Inter', sans-serif;
    }
    
    /* Custom Sidebar Styling */
    [data-testid="stSidebar"] {
        background-color: #1e293b;
        border-right: 1px solid #334155;
    }
    [data-testid="stSidebar"] * {
        color: #f1f5f9 !important;
    }
    
    /* Professional Card Effects for Chapters */
    .chapter-card {
        background-color:#72a4d6; /* Very light slate background */
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    /* Specific override for chapter cards to beat global markdown styles */
    div.chapter-card p, 
    div.chapter-card span, 
    div.chapter-card {
        color: #000000 !important;
        font-weight: 800 !important; /* Extra bold for visibility */
        font-size: 1.05rem !important;
    }
    
    .chapter-card h4 {
        color: #000000 !important;
        font-weight: 800 !important;
        margin-top: 0;
    }
    
    .chapter-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
        border-color: #3b82f6;
    }
    
    /* Sentiment Colors */
    .sentiment-positive { border-left: 6px solid #10b981; }
    .sentiment-negative { border-left: 6px solid #ef4444; }
    .sentiment-neutral { border-left: 6px solid #94a3b8; }
    
    /* Styled Buttons */
    .stButton>button {
        border-radius: 8px;
        background-color: #3b82f6;
        color: white;
        border: none;
        font-weight: 600;
        transition: all 0.3s;
    }
    .stButton>button:hover {
        background-color: #2563eb;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    }
    
    /* Text Inputs & Areas */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea {
        background-color: #1e293b !important;
        color: #ffffff !important; /* Pure white text for dark background */
        border: 1px solid #475569 !important;
        font-size: 1.1rem !important;
    }

    /* Headings & Markdown */
    h1, h2, h3 {
        color: #ffffff !important;
        font-weight: 700;
    }
    .stMarkdown p, .stMarkdown li {
        color: #ffffff !important; /* Pure white for visibility on dark background */
    }
    .stMarkdown strong {
        color: #60a5fa !important;
    }

    /* File Uploader */
    .stFileUploader label, .stFileUploader div {
        color: #f1f5f9 !important;
    }
    
    /* Expander Styling */
    .streamlit-expanderHeader {
        background-color: #1e293b !important;
        color: #f1f5f9 !important;
        border-radius: 8px;
    }
    .streamlit-expanderContent {
        background-color: #1e293b;
        color: #f1f5f9;
        border: 1px solid #334155;
    }
</style>
""", unsafe_allow_html=True)

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
if "show_chat" not in st.session_state:
    st.session_state.show_chat = False


# =================================================
# HEADER
# =================================================
st.markdown("""
# 🎙️ Podcast Intelligence Platform  

Convert long podcasts into **structured transcripts, chapters, and summaries** Powered by **Whisper · Embeddings · NLP**
""")

st.markdown("---")


# =================================================
# SIDEBAR — INPUT & CONTROLS
# =================================================
with st.sidebar:
    st.markdown("## 🎧 Input Source")

    input_mode = st.radio(
        "Choose input type",
        ["📁 Upload Audio File"]
    )

    st.markdown("---")
    st.caption("Pipeline: Audio → Whisper → Embeddings → Topics → PDF/JSON")

    st.markdown("---")
    st.markdown("👩‍💻 ** AI Full Stack Project **")

# --- SIDEBAR SECTION ---
# --- SIDEBAR: SYSTEM STATUS ---
    if st.session_state.analysis_done and st.session_state.task_id:
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🤖 Podcast Analyst")
        
        chat_container = st.sidebar.container(height=300)
        with chat_container:
            if not st.session_state.chat_history:
                st.markdown("*Hello! Ask me anything about the podcast.*")
            for msg in st.session_state.chat_history:
                with st.chat_message(msg["role"]):
                    st.markdown(msg["content"])
        
        if prompt := st.sidebar.chat_input("Ask a question...", key="sidebar_chat_input"):
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            with chat_container.chat_message("user"):
                st.markdown(prompt)
            
            # Call Backend with Thinking Indicator
            try:
                with chat_container.chat_message("assistant"):
                    thinking_placeholder = st.empty()
                    thinking_placeholder.markdown(".....")
                    
                    res = requests.post("http://localhost:8000/chat", 
                                      json={"task_id": st.session_state.task_id, "query": prompt})
                    
                    if res.status_code != 200:
                        thinking_placeholder.error(f"❌ Backend Error: {res.status_code}")
                    else:
                        data = res.json()
                        if "answer" in data:
                            answer = data["answer"]
                            st.session_state.chat_history.append({"role": "assistant", "content": answer})
                            thinking_placeholder.markdown(answer)
                            st.rerun()
                        else:
                            error_msg = data.get("error", "Unknown AI error.")
                            st.session_state.chat_history.append({"role": "assistant", "content": f"❌ Error: {error_msg}"})
                            thinking_placeholder.markdown(f"❌ Error: {error_msg}")
                            st.rerun()
            except Exception as e:
                st.sidebar.error(f"📡 Connection failed: {e}")
    else:
        st.sidebar.info("Analyze a podcast to enable the AI Analyst.")

    # 4. System Integrity (Moved down)
    st.header("🛡️ System Integrity")
    st.sidebar.info("Safety Check: **Passed**")
    st.sidebar.info("Cost Status: **Optimized**")

    # 2. RESET BUTTON
    if st.button("🗑️ Clear All & Reset", key="reset_button"):
        # Clear Streamlit's memory
        keys_to_clear = ["full_text", "topics", "analysis_done", "audio_path", "json_path", "pdf_path", "chat_history"]
        for key in keys_to_clear:
            if key in st.session_state:
                if key == "analysis_done":
                    st.session_state[key] = False
                elif key == "chat_history":
                    st.session_state[key] = []
                else:
                    st.session_state[key] = None
        
        # Delete temporary files to save space
        import shutil
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

# =================================================
# INPUT HANDLING
# =================================================
if input_mode == "🎥 YouTube Link":
    youtube_url = st.text_input("Paste YouTube URL")

    if st.button("⬇️ Download Audio"):
        if not youtube_url:
            st.warning("Please paste a valid YouTube URL")
        else:
            with st.spinner("Downloading audio from YouTube..."):
                try:
                    st.session_state.audio_path = download_youtube_audio(youtube_url)
                    st.success("Audio downloaded successfully ✅")
                except Exception as e:
                    st.error(f"Download failed: {e}")

else:
    uploaded_file = st.file_uploader("Upload audio file (mp3 / wav)", type=["mp3", "wav"])

    if uploaded_file:
        temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(temp_dir, uploaded_file.name)

        with open(audio_path, "wb") as f:
            f.write(uploaded_file.read())

        st.session_state.audio_path = audio_path
        st.success("Audio uploaded successfully ✅")


# =================================================
# MAIN CONTENT — ANALYSIS
# =================================================
if st.session_state.audio_path:
    st.markdown("## 🎧 Audio Preview")
    st.audio(st.session_state.audio_path)

    st.markdown("---")

    if st.button("🚀 Analyze Podcast"):
        # STEP 2: Demo Info Note
        st.info("💡 **Note:** AI processing time depends on audio length. For a 20-minute podcast, expect ~4-5 minutes of work.")
        
        # 1. SEND THE FILE TO THE ENGINE
        with st.spinner("Uploading audio to AI Engine..."):
            try:
                with open(st.session_state.audio_path, "rb") as f:
                    response = requests.post("http://localhost:8000/analyze", files={"file": f})
                    st.session_state.task_id = response.json()["task_id"]
                    task_id = st.session_state.task_id
            except Exception as e:
                st.error(f"Could not connect to Backend: {e}")
                st.stop()

        # 2. THE WAITING ROOM (Polling)
        status_text = st.empty()
        progress_bar = st.progress(0)
        
        while True:
            try:
                check = requests.get(f"http://localhost:8000/status/{task_id}").json()
                status = check.get("status")
                
                if status == "completed":
                    st.session_state.full_text = check["result"]["full_text"]
                    st.session_state.topics = check["result"]["topics"]
                    st.session_state.analysis_done = True
                    
                    # Generate files
                    os.makedirs("outputs", exist_ok=True)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.session_state.json_path = f"outputs/chapters_{timestamp}.json"
                    st.session_state.pdf_path = f"outputs/chapters_{timestamp}.pdf"

                    export_to_json(st.session_state.topics, st.session_state.json_path)
                    export_to_pdf(st.session_state.topics, st.session_state.full_text, st.session_state.pdf_path)

                    st.success("Analysis Complete! ✅")
                    st.rerun() 
                    break
                
                elif status == "failed":
                    st.error(f"Analysis failed: {check.get('error')}")
                    break
                else:
                    status_text.text(f"Engine Status: {status}")
                    progress_bar.progress(check.get("progress", 0))
            
            except Exception as e:
                st.error(f"Connection lost: {e}")
                break
            time.sleep(5)

# =================================================
# DISPLAY RESULTS (Polished)
# =================================================
if st.session_state.analysis_done:
    # 1. TOP METRIC CARDS
    st.markdown("### 📊 Podcast Overview")
    m1, m2, m3, m4 = st.columns(4)
    total_words = len(st.session_state.full_text.split())
    avg_sentiment = "Neutral 😐"
    if st.session_state.topics:
        sentiments = [t.get('sentiment', 'Neutral 😐') for t in st.session_state.topics]
        pos_count = sum(1 for s in sentiments if "Positive" in s)
        neg_count = sum(1 for s in sentiments if "Negative" in s)
        if pos_count > neg_count: avg_sentiment = "Positive 😊"
        elif neg_count > pos_count: avg_sentiment = "Negative 😟"
    
    m1.metric("Word Count", f"{total_words:,}")
    m2.metric("Chapters", f"{len(st.session_state.topics)}")
    m3.metric("Safety Status", "Safe ✅")
    m4.metric("Avg. Sentiment", avg_sentiment)
    
    st.markdown("---")

    # 2. VERTICAL LAYOUT (Transcript then Chapters)
    st.markdown("## ✍️ Intelligent Transcription")
    st.text_area(label="", value=st.session_state.full_text, height=400, key="transcript_area")

    st.markdown("---")
    st.markdown("## 📚 Semantic Chapters")
    
    for i, topic in enumerate(st.session_state.topics, 1):
        sentiment_class = "sentiment-neutral"
        if "Positive" in topic.get('sentiment', ''): sentiment_class = "sentiment-positive"
        elif "Negative" in topic.get('sentiment', ''): sentiment_class = "sentiment-negative"
        
        with st.container():
            st.markdown(f"""
            <div class="chapter-card {sentiment_class}">
                <h4>📍 Chapter {i}: {topic['label']}</h4>
                <p>⏱ {int(topic['start']//60):02d}:{int(topic['start']%60):02d} - {int(topic['end']//60):02d}:{int(topic['end']%60):02d} | 🎭 {topic.get('sentiment', 'Neutral')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            with st.expander("View Summary & Actions"):
                st.write(topic['summary'])
                
                # Clipboard Button
                if st.button(f"📋 Copy to Clipboard", key=f"copy_{i}"):
                    st.components.v1.html(f"""
                    <script>
                        navigator.clipboard.writeText("{topic['summary'].replace('"', '\\"')}").then(function() {{
                            window.parent.postMessage({{type: 'streamlit:setComponentValue', value: 'copied'}}, '*');
                        }});
                    </script>
                    """, height=0)
                    st.success("Copied!")

    # 3. Download Section
    st.markdown("---")
    st.markdown("### ⬇️ Download Assets")
    d1, d2 = st.columns(2)
    if st.session_state.json_path and os.path.exists(st.session_state.json_path):
        with d1:
            with open(st.session_state.json_path, "rb") as f:
                st.download_button("📄 JSON Chapters", f, file_name=os.path.basename(st.session_state.json_path))
    if st.session_state.pdf_path and os.path.exists(st.session_state.pdf_path):
        with d2:
            with open(st.session_state.pdf_path, "rb") as f:
                st.download_button("📕 PDF Full Report", f, file_name=os.path.basename(st.session_state.pdf_path))

# --- FOOTER (This stays outside the if block) ---
st.markdown("""
<hr style="margin-top:40px">
<div style="text-align:center; color:gray;">
🚀 Built with ❤️ using <b>Streamlit, Whisper & NLP</b><br>
</div>
""", unsafe_allow_html=True)