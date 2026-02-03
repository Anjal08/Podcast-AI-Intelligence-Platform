# 🎙️ Podcast AI Intelligence Platform

An end-to-end GenAI pipeline designed to transform long-form audio into structured, searchable intelligence. This platform automates transcription, performs logical topic segmentation, and provides a conversational Q&A interface for deep content insights.

## 🚀 Key Features
* **AI Transcription**: High-fidelity speech-to-text using the **OpenAI Whisper** model.
* **Semantic Segmentation**: Uses **BERT Embeddings** to detect shifts in conversation and group text into logical chapters.
* **GenAI Q&A (RAG-lite)**: A Retrieval-Augmented Generation flow that allows users to ask questions and receive answers based specifically on the podcast context.
* **Human-in-the-Loop (HITL)**: Integrated validation dashboard for humans to review and edit AI-generated chapters.
* **Enterprise Analytics**: Real-time tracking of **Safety filtering** (Sentiment analysis) and **Inference Cost Awareness**.

## 🛠️ Tech Stack
* **Backend**: FastAPI, Uvicorn
* **Frontend**: Streamlit
* **Models**: Whisper (ASR), BERT (Embeddings), DistilBERT (Question Answering)
* **Language**: Python 3.12+

## 🏗️ Architecture

The system follows a modular pipeline:
1.  **Ingestion**: Audio processing and transcription.
2.  **Processing**: Vectorization and clustering for topic detection.
3.  **UI/UX**: Streamlit dashboard for interaction and chapter exports (PDF/JSON).

## ⚡ Quick Start
1. **Clone the repo**:
   ```bash
   git clone [https://github.com/Anjal08/Podcast-AI-Intelligence-Platform.git](https://github.com/Anjal08/Podcast-AI-Intelligence-Platform.git)

## 2. Install dependencies:   
pip install -r requirements.txt
## 3. Run the Backend:
uvicorn main:app --reload
## 4.Run the Frontend:
streamlit run app.py
Built by Anjali Patel as part of the AI Internship.