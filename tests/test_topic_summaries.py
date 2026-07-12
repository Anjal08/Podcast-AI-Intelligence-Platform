from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels
from core.chapter_generator import generate_chapters
from core.exporter import export_to_json


RAW_AUDIO = "data/sample.mp3"

print("🔹 Preprocessing audio...")
audio = preprocess_audio(RAW_AUDIO)

print("🔹 Transcribing audio...")
sentences = transcribe(audio)

print("🔹 Creating sentence embeddings...")
embeddings = get_embeddings(sentences)

print("🔹 Segmenting topics...")
topics = segment_topics_with_labels(sentences, embeddings)

print("🔹 Generating chapters...")
chapters = generate_chapters(topics)

print("\n📌 FINAL CHAPTERS OUTPUT:\n")

for i, ch in enumerate(chapters, 1):
    print(f"🟢 Chapter {i}: {ch['title']}")
    print(f"Time: {ch['start']:.2f} - {ch['end']:.2f}")
    print(f"Summary: {ch['summary']}\n")

from core.exporter import export_to_json

export_to_json(chapters)
