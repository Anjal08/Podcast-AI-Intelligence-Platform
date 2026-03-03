# 🎙️ Podcast Intelligence Platform

Turn long podcasts into **clean transcripts, smart chapters, and summaries using AI**.

This project automatically:

- Downloads audio from YouTube or accepts uploaded audio  
- Transcribes speech using **OpenAI Whisper**  
- Segments podcasts into meaningful chapters  
- Generates summaries for each chapter  
- Exports results as **PDF & JSON**

🎓 Built as a **final-year / resume-grade AI project**.

---

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

---

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

---

## 📂 Project Structure

```text
Podcast-Transcription-and-Topic-Segmentation/
│
├── app.py                     # Main Streamlit app  
├── main.py                    # Backend FastAPI/Groq server
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
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Anjal08/Podcast-AI-Intelligence-Platform.git
cd Podcast-AI-Intelligence-Platform
```

### 2️⃣ Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate   # Windows
# or
source venv/bin/activate  # macOS/Linux
```

### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Install FFmpeg
The backend requires FFmpeg for audio processing.

**Windows:**
1. Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
2. Extract and add the `bin` folder to your **System PATH**.

**macOS:**
```bash
brew install ffmpeg
```

---

## ▶️ Run the Application

1. **Start the Backend Server:**
```bash
python main.py
```

2. **Start the Streamlit UI:**
```bash
streamlit run app.py
```

---

## 📸 How It Works (Pipeline)

```text
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
```

---

## 🙌 Author

**Anjali Patel**  
Final Year Engineering Student  
Focused on **AI, NLP & Full-Stack Projects**
