from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels

RAW_AUDIO = "data/long_audio.mp3"

audio = preprocess_audio(RAW_AUDIO)
sentences = transcribe(audio)
embeddings = get_embeddings(sentences)

topics = segment_topics_with_labels(sentences, embeddings)

for i, t in enumerate(topics):
    print(f"\n🟢 Topic {i+1}: {t['label']}")
    print(f"Time: {t['start']:.2f} - {t['end']:.2f}")
    print("Keywords:", t["keywords"])