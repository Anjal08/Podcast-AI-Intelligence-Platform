import os
from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics_with_labels

DATA_DIR = "data"

for file in os.listdir(DATA_DIR):
    if not file.endswith((".mp3", ".wav", ".m4a")):
        continue

    print(f"\n==============================")
    print(f"Processing: {file}")
    print(f"==============================")

    audio_path = os.path.join(DATA_DIR, file)

    audio = preprocess_audio(audio_path)
    sentences = transcribe(audio)
    embeddings = get_embeddings(sentences)
    topics = segment_topics_with_labels(sentences, embeddings)

    for i, t in enumerate(topics):
        print(f"\n🟢 Topic {i+1}: {t['label']}")
        print(f"Time: {t['start']:.2f} - {t['end']:.2f}")