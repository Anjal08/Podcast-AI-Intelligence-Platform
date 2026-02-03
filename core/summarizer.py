from transformers import pipeline

# Use text-generation pipeline (compatible with new HF versions)
summarizer = pipeline(
    "text-generation",
    model="sshleifer/distilbart-cnn-12-6",
    device=-1  # CPU
)

def summarize_topic(sentences, max_sentences=2):
    return " ".join(s["text"] for s in sentences[:max_sentences])


    # Very small topics → return text directly
    if len(text.split()) < 40:
        return text

    result = summarizer(
        text,
        max_length=max_length,
        do_sample=False,
        truncation=True
    )

    return result[0]["generated_text"]
