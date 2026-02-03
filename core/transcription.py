import os
import whisper
import soundfile as sf

model = whisper.load_model("base")

def transcribe(audio_path):
    # 1️⃣ Check file exists
    if not os.path.exists(audio_path):
        raise ValueError("Audio file does not exist")

    # 2️⃣ Check duration
    data, samplerate = sf.read(audio_path)
    duration = len(data) / samplerate

    if duration < 1:
        raise ValueError("Audio is empty or too short for transcription")

    # 3️⃣ Transcribe safely
    result = model.transcribe(
        audio_path,
        fp16=False,
        condition_on_previous_text=False
    )

    sentences = []
    for seg in result["segments"]:
        sentences.append({
            "text": seg["text"].strip(),
            "start": seg["start"],
            "end": seg["end"]
        })

    return sentences
