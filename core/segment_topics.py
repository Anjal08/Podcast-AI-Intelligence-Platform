import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def segment_topics(sentences, embeddings, threshold=0.75):
    """
    sentences: list of dicts -> [{"text": str, "start": float, "end": float}]
    embeddings: numpy array of shape (n_sentences, dim)
    threshold: similarity threshold to detect topic change
    """

    # Safety checks (VERY IMPORTANT)
    if not sentences or len(sentences) == 0:
        return []

    if len(sentences) == 1:
        return [{
            "sentences": sentences,
            "start": sentences[0]["start"],
            "end": sentences[0]["end"]
        }]

    topics = []

    current_topic = {
        "sentences": [sentences[0]],
        "start": sentences[0]["start"]
    }

    for i in range(1, len(sentences)):
        # cosine similarity between consecutive sentence embeddings
        sim = cosine_similarity(
            embeddings[i - 1].reshape(1, -1),
            embeddings[i].reshape(1, -1)
        )[0][0]

        if sim < threshold:
            # Topic boundary detected
            current_topic["end"] = sentences[i - 1]["end"]
            topics.append(current_topic)

            # start new topic
            current_topic = {
                "sentences": [sentences[i]],
                "start": sentences[i]["start"]
            }
        else:
            current_topic["sentences"].append(sentences[i])

    # close last topic
    current_topic["end"] = current_topic["sentences"][-1]["end"]
    topics.append(current_topic)

    return topics