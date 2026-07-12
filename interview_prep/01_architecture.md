# System Architecture: Podcast AI Intelligence Platform

## Overview
The platform is designed as a decoupled, asynchronous system. The heavy AI lifting is pushed to background workers on the backend, while the frontend remains lightweight, responsive, and highly interactive.

## The Tech Stack

### 1. Frontend (The Client)
* **Framework:** React 19 + TypeScript + Vite.
* **Routing:** `react-router-dom` for Single Page Application (SPA) navigation.
* **Styling:** Vanilla CSS focusing on a premium, dark-mode SaaS aesthetic (inspired by Vercel/Linear).
* **State Management:** React Context API (`AnalysisContext`, `AudioContext`).
* **Icons:** `lucide-react`.

### 2. Backend (The Engine)
* **Framework:** FastAPI (Python 3.10) - chosen for its asynchronous capabilities and speed.
* **Concurrency:** `BackgroundTasks` to handle heavy audio processing without blocking HTTP responses.
* **APIs:** 
  * `/analyze`: Uploads file, returns a tracking `task_id`.
  * `/status/{task_id}`: Polling endpoint for the frontend to check progress.
  * `/chat`: RAG-based LLM query endpoint.

### 3. AI & ML Models (The Brain)
* **Speech-to-Text:** OpenAI Whisper (Local/API) - high accuracy with word-level timestamps.
* **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` - converts text into mathematical vectors for similarity comparison.
* **LLM (Large Language Model):** Groq Llama-3 (`llama-3.3-70b-versatile`) - used for summarization, insights, and chat. Extremely low latency.
* **Sentiment Analysis:** `TextBlob`.

## System Diagram
```text
[ React Frontend ] ──(Upload Audio)──> [ FastAPI Backend ]
       │                                     │
       ▼ (Polls for Status)                  ▼
[ UI Progress Bar ] <────── [ Background Async Worker ]
                                     │
                                     ├─> 1. FFmpeg (Audio Normalization)
                                     ├─> 2. Whisper AI (Transcription & Timestamps)
                                     ├─> 3. Sentence Transformers (Vector Embeddings)
                                     ├─> 4. Topic Segmentation (Cosine Similarity)
                                     └─> 5. Groq Llama-3 (Summarization & Insights)
                                     │
                            [ Results saved to Memory/DB ]
```

## Key Architectural Decisions
1. **Asynchronous Processing:** Long audio files take time to process. If we processed them synchronously, the HTTP request would time out. Using a background task and polling ensures a smooth user experience.
2. **Local Embeddings over LLM for Segmentation:** Instead of asking an LLM "where do chapters begin?" (which is slow and expensive), we use local vector embeddings and math (cosine similarity) to detect topic drift. We only use the LLM to *summarize* the segments once they are found.
3. **RAG (Retrieval-Augmented Generation):** The Chat feature doesn't send the whole transcript to the LLM. It embeds the user's query, finds the top 5 most similar transcript chunks via cosine similarity, and only sends those chunks to the LLM. This saves tokens, reduces latency, and prevents hallucinations.
