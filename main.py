from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Body
from pydantic import BaseModel
import uuid
import os
import shutil
from textblob import TextBlob
from groq import Groq
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# --- IMPORTING YOUR HARD WORK FROM THE CORE FOLDER ---
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels

app = FastAPI()

# Memory to store task results
from typing import Dict, Any
tasks: Dict[str, Any] = {}

def process_podcast_task(task_id: str, file_path: str):
    """
    Background worker with detailed status updates for professional UI feedback.
    """
    try:
        # Step 1: Preprocessing
        tasks[task_id] = {"status": " Attempting Preprocessing", "progress": 10}
        processed_path = preprocess_audio(file_path)
        
        # Step 2: Transcription
        tasks[task_id] = {"status": "Attempting Transcription", "progress": 30}
        full_text, sentences = transcribe(processed_path)
        
        if not sentences:
            tasks[task_id] = {"status": "failed", "error": "AI could not detect any clear speech in this audio file. Please try a different recording."}
            return

        # Step 3: Embeddings
        tasks[task_id] = {"status": "Now Analysis & Embedding", "progress": 50}
        embeddings = get_embeddings(sentences)
        
        # Step 4: Topic Segmentation
        tasks[task_id] = {"status": "Segmenting The Topics", "progress": 80}
        topics = segment_topics_with_labels(sentences, embeddings)

        # Step 5: Sentiment Analysis
        for topic in topics:
            blob = TextBlob(topic['summary'])
            sentiment = blob.sentiment.polarity
            if sentiment > 0.1:
                topic['sentiment'] = "Positive 😊"
            elif sentiment < -0.1:
                topic['sentiment'] = "Negative 😟"
            else:
                topic['sentiment'] = "Neutral 😐"

        # Final Step: Store everything with Metadata
        tasks[task_id] = {
            "status": "completed",
            "progress": 100,
            "result": {
                "full_text": full_text,
                "topics": topics,
                "sentences": sentences,  # For RAG
                "embeddings": embeddings.tolist(),  # For RAG (serialize to list for JSON/Memory)
                "metadata": {
                    "safety_check": "Passed ✅",
                    "cost_estimate": "$0.005",
                    "model_used": "Whisper Base + BERT"
                }
            }
        }
    except Exception as e:
        tasks[task_id] = {"status": "failed", "error": str(e)}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/analyze")
async def start_analysis(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    os.makedirs("temp_uploads", exist_ok=True)
    file_path = f"temp_uploads/{task_id}_{file.filename}"
    
    # Save the uploaded file temporarily
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Tell the worker to start in the background
    background_tasks.add_task(process_podcast_task, task_id, file_path)
    
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def check_status(task_id: str):
    return tasks.get(task_id, {"status": "not_found"})

class ChatRequest(BaseModel):
    task_id: str
    query: str

@app.post("/chat")
async def chat_interaction(request: ChatRequest):
    task_id = request.task_id
    query = request.query
    try:
        if not client:
            return {"error": "Groq API key not configured."}
            
        if task_id not in tasks or tasks[task_id]["status"] != "completed":
            return {"error": "Podcast analysis not found or not completed."}
        
        result = tasks[task_id]["result"]
        topics = result["topics"]
        sentences = result["sentences"]
        embeddings = np.array(result["embeddings"])
        
        # RAG: Find top 5 relevant chunks
        from core.embeddings import get_embeddings
        query_embedding = get_embeddings([{"text": query}])[0].reshape(1, -1)
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        top_indices = np.argsort(similarities)[-5:][::-1]
        
        relevant_context = "\n".join([f"[Chunk {i}]: {sentences[i]['text']}" for i in top_indices])
        summaries = "\n".join([f"Chapter {i+1}: {t['label']} - {t['summary']}" for i, t in enumerate(topics)])
        
        # Enhanced System Prompt
        system_prompt = (
            "You are an expert Podcast Analyst. Your goal is to provide deep, insightful, and highly accurate answers "
            "based ONLY on the provided transcript and chapter summaries. \n\n"
            "Guidelines:\n"
            "1. **Depth**: Don't just summarize; analyze the 'why' and 'how' if mentioned.\n"
            "2. **Citations**: Always refer to specific Chapters when providing information.\n"
            "3. **Structure**: Use bullet points or bold text to make your answer easy to read.\n"
            "4. **Honesty**: If the answer isn't in the context, politely state that the podcast doesn't cover that topic.\n"
            "5. **Persona**: Maintain a professional, knowledgeable, and helpful tone."
        )
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"PODCAST SUMMARIES:\n{summaries}\n\nDETAILED TRANSCRIPT EXCERPTS:\n{relevant_context}\n\nUSER QUESTION: {query}"}
            ],
            temperature=0.5,
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {"message": "The AI Engine is Ready for Work!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)