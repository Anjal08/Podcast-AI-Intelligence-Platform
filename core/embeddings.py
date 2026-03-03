from sentence_transformers import SentenceTransformer
import numpy as np

# Lightweight & fast model
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")

def get_embeddings(sentences):
    if not sentences:
        return np.zeros((0, 384))
        
    texts = [s["text"] for s in sentences]
    embeddings = model.encode(
        texts,
        batch_size=8,
        show_progress_bar=False
    )
    return embeddings