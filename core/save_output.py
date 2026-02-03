import json
import os

def save_transcript_txt(transcript, output_path="outputs/transcript.txt"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        for seg in transcript:
            line = f"[{seg['start']:.2f} - {seg['end']:.2f}] {seg['text']}\n"
            f.write(line)

def save_transcript_json(transcript, output_path="outputs/transcript.json"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, indent=2, ensure_ascii=False)