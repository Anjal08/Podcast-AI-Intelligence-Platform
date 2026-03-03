import os
import json
from fpdf import FPDF


# -------------------------------
# JSON EXPORT
# -------------------------------
def export_to_json(topics, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(topics, f, indent=2, ensure_ascii=False)

    return output_path


# -------------------------------
# PDF EXPORT (TRANSCRIPT + CHAPTERS)
# -------------------------------
def export_to_pdf(topics, transcript_text, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Podcast Transcription & Topic Segmentation", ln=True)
    pdf.ln(5)

    # -------- TRANSCRIPTION --------
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Full Transcription", ln=True)
    pdf.ln(3)

    pdf.set_font("Arial", size=11)
    safe_text = transcript_text.replace("\u00a0", " ")

    pdf.multi_cell(0, 8, safe_text)
    pdf.ln(5)

    # -------- CHAPTERS --------
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Chapters", ln=True)
    pdf.ln(3)

    pdf.set_font("Arial", size=11)

    for i, topic in enumerate(topics, 1):
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, f"Chapter {i}: {topic['label']}", ln=True)

        pdf.set_font("Arial", size=11)
        pdf.cell(
            0,
            8,
            f"Time: {topic['start']:.2f}s - {topic['end']:.2f}s",
            ln=True,
        )

        summary = topic["summary"].replace("\u00a0", " ")
        pdf.multi_cell(0, 8, f"Summary: {summary}")
        pdf.ln(3)

    pdf.output(output_path)
    return output_path

