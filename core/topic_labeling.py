from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

_embedding_model = None
_kw_model = None


def get_kw_model():
    global _kw_model, _embedding_model

    if _kw_model is None:
        print("🔹 Loading keyword model (only once)...")
        _embedding_model = SentenceTransformer(
            "paraphrase-MiniLM-L3-v2",
            device="cpu"
        )
        _kw_model = KeyBERT(model=_embedding_model)

    return _kw_model


def extract_topic_keywords(sentences, top_n=3):
    kw_model = get_kw_model()
    text = " ".join(s["text"] for s in sentences)

    keywords = kw_model.extract_keywords(
        text,
        top_n=top_n,
        stop_words="english"
    )

    return [k[0] for k in keywords]


def generate_topic_label(keywords):
    if not keywords:
        return "General Discussion"

    # 🔹 Priority-ordered domains (MOST IMPORTANT FIX)
    domain_map = [
        ("Personal Growth", ["praise", "gratitude", "confidence", "self", "growth"]),
        ("Relationships", ["wife", "husband", "family", "marriage", "kids"]),
        ("Health", ["health", "mental", "addiction", "stress", "therapy"]),
        ("Society", ["community", "culture", "world", "people"]),
        ("Education", ["education", "learning", "students", "school", "college"]),
        ("Business", ["business", "job", "career", "company", "work"]),
        ("Technology", ["tech", "screen", "internet", "digital", "ai", "software", "data"])
    ]

    # normalize keywords
    keywords_clean = []
    for k in keywords:
        k = k.strip().lower()
        if k and k not in keywords_clean:
            keywords_clean.append(k)

    detected_domain = None
    for domain, vocab in domain_map:
        if any(v in kw for kw in keywords_clean for v in vocab):
            detected_domain = domain
            break

    core_phrase = " ".join(keywords_clean[:2]).title()

    return f"{detected_domain}: {core_phrase}" if detected_domain else core_phrase
