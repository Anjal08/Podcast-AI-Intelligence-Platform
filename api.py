from fastapi import FastAPI, UploadFile, File
import tempfile
import os

from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels

app = FastAPI(title="Podcast Intelligence API")


@app.post("/analyze")
async def analyze_podcast(file: UploadFile = File(...)):
    # Save uploaded file
    temp_dir = tempfile.mkdtemp()
    audio_path = os.path.join(temp_dir, file.filename)

    with open(audio_path, "wb") as f:
        f.write(await file.read())

    # Pipeline
    processed_audio = preprocess_audio(audio_path)
    sentences = transcribe(processed_audio)
    embeddings = get_embeddings(sentences)
    topics = segment_topics_with_labels(sentences, embeddings)

    return {
        "transcription": " ".join(s["text"] for s in sentences),
        "chapters": topics
    }
