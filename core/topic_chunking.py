from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# -----------------------
# CONFIGURATION
# -----------------------
MIN_TOPIC_DURATION = 30       # seconds
MAX_TOPIC_DURATION = 90       # seconds
MIN_SENTENCES = 4
MERGE_SIM_THRESHOLD = 0.45


# -----------------------
# HELPERS
# -----------------------
def topic_duration(topic):
    return topic["end"] - topic["start"]


def get_topic_embedding(topic, sentence_embeddings, index_map):
    """
    Average embedding of all sentences in a topic
    """
    indices = [index_map[id(s)] for s in topic["sentences"]]
    return np.mean(sentence_embeddings[indices], axis=0).reshape(1, -1)


def merge_topics(t1, t2):
    return {
        "sentences": t1["sentences"] + t2["sentences"],
        "start": t1["start"],
        "end": t2["end"],
    }


# -----------------------
# MAIN CHUNKING LOGIC
# -----------------------
def chunk_topics(topics, sentence_embeddings):
    """
    Merge micro-topics into macro topics using:
    - duration
    - semantic similarity
    - sentence count
    """

    if not topics:
        return []

    # 🔹 Build sentence → embedding index map (GLOBAL, CORRECT)
    index_map = {}
    global_idx = 0
    for topic in topics:
        for s in topic["sentences"]:
            index_map[id(s)] = global_idx
            global_idx += 1

    chunked_topics = [topics[0]]

    for i in range(1, len(topics)):
        current = topics[i]
        prev = chunked_topics[-1]

        prev_duration = topic_duration(prev)
        curr_duration = topic_duration(current)

        prev_emb = get_topic_embedding(prev, sentence_embeddings, index_map)
        curr_emb = get_topic_embedding(current, sentence_embeddings, index_map)

        similarity = cosine_similarity(prev_emb, curr_emb)[0][0]

        # -----------------------
        # MERGE DECISION
        # -----------------------
        should_merge = (
            prev_duration < MAX_TOPIC_DURATION
            and (
                similarity >= MERGE_SIM_THRESHOLD
                or curr_duration < MIN_TOPIC_DURATION
                or len(current["sentences"]) < MIN_SENTENCES
            )
        )

        if should_merge:
            chunked_topics[-1] = merge_topics(prev, current)
        else:
            chunked_topics.append(current)

    return chunked_topics

