from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics

RAW_AUDIO = "data/sample.mp3"

print("Preprocessing...")
audio = preprocess_audio(RAW_AUDIO)

print("Transcribing...")
sentences = transcribe(audio)

print("Creating embeddings...")
embeddings = get_embeddings(sentences)

print("Segmenting topics...")
topics = segment_topics(sentences, embeddings)

for i, topic in enumerate(topics):
    print(f"\n🟢 Topic {i+1}")
    print(f"Time: {topic['start']:.2f} - {topic['end']:.2f}")
    print("Sample sentences:")
    for s in topic["sentences"][:2]:
        print(" -", s["text"])