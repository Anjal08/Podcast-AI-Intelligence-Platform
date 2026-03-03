import os
import subprocess
import tempfile

def preprocess_audio(input_path):
    output_path = os.path.join(
        tempfile.mkdtemp(),
        "processed.wav"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        output_path
    ]

    subprocess.run(cmd, check=True)
    return output_path
