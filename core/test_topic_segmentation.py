from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.embeddings import get_embeddings
from core.topic_segmentation import segment_topics

# Step 1: preprocess + transcribe
audio_path = preprocess_audio("data/sample.mp3")
sentences = transcribe(audio_path)

# Step 2: embeddings
embeddings = get_embeddings(sentences)

# Step 3: topic segmentation
topics = segment_topics(sentences, embeddings)

# Print results
for i, topic in enumerate(topics):
    print(f"\n🟢 Topic {i+1}")
    print(f"Time: {topic['start']:.2f} - {topic['end']:.2f}")
    for s in topic["sentences"][:3]:
        print(" ", s["text"])