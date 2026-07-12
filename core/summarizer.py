import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
        # Ask Groq to summarize (zero local RAM usage!)
        prompt = f"Summarize the following text in 2 concise sentences. Do not use conversational filler, just provide the summary:\n\n{text}"
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Summarization error: {e}")
        # Fallback to first few sentences
        return " ".join(s["text"] for s in sentences[:max_sentences])
