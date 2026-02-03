from core.preprocess import preprocess_audio
from core.transcription import transcribe

RAW_AUDIO = "data/sample.mp3"      # change if needed
PROCESSED_AUDIO = "data/input_audio.wav"

print("🔹 Preprocessing audio...")
processed_path = preprocess_audio(RAW_AUDIO, PROCESSED_AUDIO)

print("🔹 Running Whisper transcription...")
sentences = transcribe(processed_path)

print("\n🔹 First 10 transcription segments:\n")
for s in sentences[:10]:
    print(f"[{s['start']:.2f} - {s['end']:.2f}] {s['text']}")