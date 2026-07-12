import streamlit as st
import tempfile
import os
from datetime import datetime

from core.audio_loader import download_youtube_audio
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels
from core.exporter import export_to_json, export_to_pdf


# =================================================
# PAGE CONFIG
# =================================================
st.set_page_config(
    page_title="Podcast Intelligence Platform",
    page_icon="🎙️",
    layout="wide"
)

# =================================================
# SESSION STATE
# =================================================
if "audio_path" not in st.session_state:
    st.session_state.audio_path = None
if "analysis_done" not in st.session_state:
    st.session_state.analysis_done = False
if "json_path" not in st.session_state:
    st.session_state.json_path = None
if "pdf_path" not in st.session_state:
    st.session_state.pdf_path = None
if "topics" not in st.session_state:
    st.session_state.topics = None
if "full_text" not in st.session_state:
    st.session_state.full_text = None


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
        ["🎥 YouTube Link", "📁 Upload Audio File"]
    )

    st.markdown("---")
    st.caption("Pipeline: Audio → Whisper → Embeddings → Topics → PDF/JSON")

    st.markdown("---")
    st.markdown("👩‍💻 **Final Year / Resume Project**")


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
        with st.spinner("Processing podcast... Please wait ⏳"):

            # 1. Preprocess
            processed_audio = preprocess_audio(st.session_state.audio_path)

            # 2. Transcription
            try:
                sentences = transcribe(processed_audio)
            except Exception as e:
                st.error(f"❌ Transcription failed: {e}")
                st.stop()

            st.session_state.full_text = " ".join(s["text"] for s in sentences)

            # 3. Embeddings
            embeddings = get_embeddings(sentences)

            # 4. Topic Segmentation
            st.session_state.topics = segment_topics_with_labels(sentences, embeddings)

            # 5. Export Logic
            os.makedirs("outputs", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            json_p = f"outputs/chapters_{timestamp}.json"
            pdf_p = f"outputs/chapters_{timestamp}.pdf"

            export_to_json(st.session_state.topics, json_p)
            export_to_pdf(st.session_state.topics, st.session_state.full_text, pdf_p)

            st.session_state.json_path = json_p
            st.session_state.pdf_path = pdf_p
            st.session_state.analysis_done = True
            st.success("✅ Analysis complete!")

# Display Results if Analysis is Done
if st.session_state.analysis_done:
    st.markdown("## 📝 Full Transcription")
    st.text_area(label="", value=st.session_state.full_text, height=320)

    st.subheader("📚 Podcast Chapters")
    for i, topic in enumerate(st.session_state.topics, 1):
        with st.expander(f"🟢 Chapter {i}: {topic['label']}"):
            st.write(f"⏱ **Time:** {topic['start']:.2f}s – {topic['end']:.2f}s")
            st.write(f"📝 **Summary:** {topic['summary']}")

    # =================================================
    # DOWNLOAD SECTION (Moved outside the loop)
    # =================================================
    st.markdown("---")
    st.markdown("### ⬇️ Download Results")

    col1, col2 = st.columns(2)

    if st.session_state.json_path and os.path.exists(st.session_state.json_path):
        with col1:
            with open(st.session_state.json_path, "rb") as f:
                st.download_button(
                    "📄 Download Chapters (JSON)",
                    f,
                    file_name="podcast_chapters.json",
                    use_container_width=True,
                    key="json_download_main" # Unique Key
                )

    if st.session_state.pdf_path and os.path.exists(st.session_state.pdf_path):
        with col2:
            with open(st.session_state.pdf_path, "rb") as f:
                st.download_button(
                    "📕 Download Full Report (PDF)",
                    f,
                    file_name="podcast_report.pdf",
                    use_container_width=True,
                    key="pdf_download_main" # Unique Key
                )


# =================================================
# FOOTER
# =================================================
st.markdown("""
<hr style="margin-top:40px">
<div style="text-align:center; color:gray;">
🚀 Built with ❤️ using <b>Streamlit, Whisper & NLP</b><br>
</div>
""", unsafe_allow_html=True)