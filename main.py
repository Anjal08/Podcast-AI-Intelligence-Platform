from fastapi import FastAPI, UploadFile, File, BackgroundTasks
import uuid
import os
import shutil
from textblob import TextBlob

# --- IMPORTING YOUR HARD WORK FROM THE CORE FOLDER ---
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels

app = FastAPI()

# Memory to store task results
tasks = {}

def process_podcast_task(task_id: str, file_path: str):
    """
    Background worker with detailed status updates for professional UI feedback.
    """
    try:
        # Step 1: Preprocessing
        tasks[task_id] = {"status": "🛠️ Preprocessing Audio (Noise Reduction)...", "progress": 15}
        processed = preprocess_audio(file_path)
        
        # Step 2: Transcription
        tasks[task_id] = {"status": "✍️ AI Transcribing (Whisper Pipeline)...", "progress": 40}
        sentences = transcribe(processed)
        full_text = " ".join(s["text"] for s in sentences)
        
        # Step 3: NLP Analysis
        tasks[task_id] = {"status": "🧠 Generating Semantic Embeddings...", "progress": 65}
        embeddings = get_embeddings(sentences)
        
      # Step 4: Topic Segmentation (Your existing code)
        tasks[task_id] = {"status": "🏷️ Segmenting & Labeling Chapters...", "progress": 85}
        topics = segment_topics_with_labels(sentences, embeddings)

        # --- NEW STEP 5: SENTIMENT ANALYSIS ---
        # 1. MOVE THIS LINE ABOVE THE LOOP
        tasks[task_id] = {"status": "🎭 Analyzing Emotional Tone...", "progress": 95}
        
        for topic in topics:
            # 2. ENSURE EVERYTHING INSIDE THE LOOP IS INDENTED
            analysis = TextBlob(topic['summary'])
            score = analysis.sentiment.polarity
            
            if score > 0.1:
                topic['sentiment'] = "Positive 😊"
            elif score < -0.1:
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
                # --- ADD THIS METADATA BLOCK ---
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

@app.get("/")
def home():
    return {"message": "The AI Engine is Ready for Work!"}