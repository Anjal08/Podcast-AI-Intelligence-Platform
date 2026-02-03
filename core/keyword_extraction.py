from keybert import KeyBERT

# Use lightweight MiniLM model
kw_model = KeyBERT(model="paraphrase-MiniLM-L3-v2")

def extract_keywords_keybert(topic_sentences, top_n=5):
    """
    topic_sentences: list of sentence dicts
    """
    text = " ".join([s["text"] for s in topic_sentences])

    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        top_n=top_n,
        use_mmr=True,       # diversity
        diversity=0.6
    )

    # keywords = [(word, score), ...]
    return [kw[0] for kw in keywords]