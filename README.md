# 🎙️ Podcast Intelligence Platform

Turn long podcasts into **clean transcripts, smart chapters, and summaries using AI**.

This project automatically:

- Downloads audio from YouTube or accepts uploaded audio  
- Transcribes speech using **OpenAI Whisper**  
- Segments podcasts into meaningful chapters  
- Generates summaries for each chapter  
- Exports results as **PDF & JSON**

🎓 Built as a **final-year / resume-grade AI project**.

## 🚀 Features

- 🎥 **YouTube Link Support** – Paste any YouTube podcast link  
- 📁 **Audio Upload** – Upload `.mp3` or `.wav` files  
- 🧠 **AI Transcription** – Accurate speech-to-text using Whisper  
- 🧩 **Topic Segmentation** – Automatic chapter detection  
- 📝 **Summaries per Chapter**  
- 📄 **Download Outputs**
  - Full transcription + chapters in **PDF**
  - Structured data in **JSON**
- 🖥️ **Clean Streamlit UI** (real-world dashboard style)

## 🛠️ Tech Stack

| Component | Technology |
|---------|------------|
| Frontend | Streamlit |
| Speech-to-Text | OpenAI Whisper |
| NLP | Sentence Embeddings |
| Topic Segmentation | Clustering + Labeling |
| PDF Export | FPDF |
| Audio Processing | FFmpeg |
| YouTube Download | yt-dlp |
| Language | Python |


## 📂 Project Structure

Podcast-Transcription-and-Topic-Segmentation/
│
├── app.py                     # Main Streamlit app  
├── core/
│   ├── audio_loader.py        # YouTube audio download  
│   ├── preprocess.py          # Audio preprocessing  
│   ├── transcription.py       # Whisper transcription  
│   ├── embeddings.py          # Sentence embeddings  
│   ├── topic_segmentation.py  # Topic detection  
│   ├── exporter.py            # PDF & JSON export  
│
├── outputs/                   # Generated PDF & JSON files  
├── requirements.txt  
└── README.md


## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/podcast-intelligence-platform.git
cd podcast-intelligence-platform

2️⃣ Create Virtual Environment
python -m venv venv
venv\Scripts\activate   # Windows

3️⃣ Install Dependencies
pip install -r requirements.txt


⚠️ **IMPORTANT:**  
Replace `your-username` with your GitHub username later.

---

# ✅ STEP 6: Add FFmpeg Installation (Very Important)

📌 Paste below setup:

```md
### 4️⃣ Install FFmpeg

Download FFmpeg from:  
👉 https://www.gyan.dev/ffmpeg/builds/

Steps:
1. Extract the zip file  
2. Add `ffmpeg/bin` to **System PATH**  
3. Verify installation:
```bash
ffmpeg -version


✅ This prevents **“it doesn’t work” issues** for others

---

# ✅ STEP 7: Add ▶️ Run the Application

📌 Paste:

```md
## ▶️ Run the Application

```bash
streamlit run app.py


---

# ✅ STEP 8: Add 📸 How It Works (Pipeline)

📌 Paste:

```md
## 📸 How It Works (Pipeline)

Audio Input  
↓  
Preprocessing (FFmpeg)  
↓  
Transcription (Whisper)  
↓  
Sentence Embeddings  
↓  
Topic Segmentation  
↓  
Summaries + Chapters  
↓  
PDF / JSON Export


---

# ✅ STEP 8: Add 📸 How It Works (Pipeline)

📌 Paste:

```md
## 📸 How It Works (Pipeline)

Audio Input  
↓  
Preprocessing (FFmpeg)  
↓  
Transcription (Whisper)  
↓  
Sentence Embeddings  
↓  
Topic Segmentation  
↓  
Summaries + Chapters  
↓  
PDF / JSON Export

## 🙌 Author

**Anjali Patel**  
Final Year Engineering Student  
Focused on **AI, NLP & Full-Stack Projects**

