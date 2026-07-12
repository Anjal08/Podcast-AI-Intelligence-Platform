import os
import soundfile as sf
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe(audio_path):
    # 1️⃣ Check file exists
    if not os.path.exists(audio_path):
        raise ValueError("Audio file does not exist")

    # 2️⃣ Check duration
    data, samplerate = sf.read(audio_path)
    duration = len(data) / samplerate

    if duration < 1:
        raise ValueError("Audio is empty or too short for transcription")

    # 3️⃣ Transcribe safely using Groq API
    with open(audio_path, "rb") as file:
        result = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), file.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
        )

    # Handle object or dict access depending on python SDK version
    full_text = result.text.strip() if hasattr(result, "text") else result.get("text", "").strip()
    
    sentences = []
    segments = result.segments if hasattr(result, "segments") else result.get("segments", [])
    
    for seg in segments:
        text = seg.text if hasattr(seg, "text") else seg.get("text", "")
        start = seg.start if hasattr(seg, "start") else seg.get("start", 0)
        end = seg.end if hasattr(seg, "end") else seg.get("end", 0)
        
        sentences.append({
            "text": text.strip(),
            "start": start,
            "end": end
        })

    return full_text, sentences
