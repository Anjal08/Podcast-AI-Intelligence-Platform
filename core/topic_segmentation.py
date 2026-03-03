from sklearn.metrics.pairwise import cosine_similarity

from core.topic_labeling import extract_topic_keywords, generate_topic_label
from core.summarizer import summarize_topic
from core.topic_chunking import chunk_topics


def segment_topics_with_labels(sentences, embeddings, threshold=0.65):
    """
    Step 1: Create micro-topics using sentence similarity
    Step 2: Chunk micro-topics into macro topics
    Step 3: Label + summarize final topics
    """

    # -------------------------------
    # STEP 1: MICRO-TOPIC SEGMENTATION
    # -------------------------------
    micro_topics = []

    current_topic = {
        "sentences": [sentences[0]],
        "start": sentences[0]["start"]
    }

    for i in range(1, len(sentences)):
        sim = cosine_similarity(
            embeddings[i - 1].reshape(1, -1),
            embeddings[i].reshape(1, -1)
        )[0][0]

        if sim < threshold:
            current_topic["end"] = sentences[i - 1]["end"]
            micro_topics.append(current_topic)

            current_topic = {
                "sentences": [sentences[i]],
                "start": sentences[i]["start"]
            }
        else:
            current_topic["sentences"].append(sentences[i])

    current_topic["end"] = current_topic["sentences"][-1]["end"]
    micro_topics.append(current_topic)

    # -------------------------------
    # STEP 2: CHUNK MICRO → MACRO TOPICS
    # -------------------------------
    chunked_topics = chunk_topics(micro_topics, embeddings)

    # -------------------------------
    # STEP 3: LABEL + SUMMARIZE
    # -------------------------------
    final_topics = []

    for topic in chunked_topics:
        keywords = extract_topic_keywords(topic["sentences"])
        topic["keywords"] = keywords
        topic["label"] = generate_topic_label(keywords)

        try:
            topic["summary"] = summarize_topic(topic["sentences"])
        except Exception:
            topic["summary"] = " ".join(
                s["text"] for s in topic["sentences"][:2]
            )

        final_topics.append(topic)

    return final_topics
