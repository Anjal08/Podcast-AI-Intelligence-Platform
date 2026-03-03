from core.preprocess import preprocess_audio
from core.transcription import transcribe
from core.save_output import save_transcript_txt, save_transcript_json

RAW_AUDIO = "data/sample.mp3"

print("🔹 Preprocessing audio...")
processed_audio = preprocess_audio(RAW_AUDIO)

print("🔹 Running Whisper transcription...")
segments = transcribe(processed_audio)

print("\n🔹 Transcription output (first 10 lines):\n")
for seg in segments[:10]:
    print(f"[{seg['start']:.2f} - {seg['end']:.2f}] {seg['text']}")

# 🔽 NEW PART
save_transcript_txt(segments)
save_transcript_json(segments)

print("\n✅ Transcript saved to outputs/ folder")