from transformers import pipeline

# Use text-generation pipeline (compatible with new HF versions)
summarizer = pipeline(
    "text-generation",
    model="sshleifer/distilbart-cnn-12-6",
    device=-1  # CPU
)

def summarize_topic(sentences, max_sentences=2):
    # Join sentences into text
    text = " ".join(s["text"] for s in sentences).strip()
    
    if not text:
        return "No content to summarize."

    # Very small topics -> return first few sentences
    word_count = len(text.split())
    if word_count < 25:
        return text

    try:
        # Truncate if too long for DistilBART
        input_text = " ".join(text.split()[:400])
        
        result = summarizer(
            input_text,
            max_length=150,
            min_length=30,
            do_sample=False,
            truncation=True
        )
        # Handle different result keys depending on pipeline
        summary = result[0].get("summary_text") or result[0].get("generated_text")
        return summary.strip() if summary else text
    except Exception as e:
        print(f"Summarization error: {e}")
        # Fallback to first few sentences
        return " ".join(s["text"] for s in sentences[:max_sentences])
