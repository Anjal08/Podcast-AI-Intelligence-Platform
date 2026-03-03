def generate_chapters(topics):
    chapters = []

    for t in topics:
        chapters.append({
            "title": t["label"],
            "start": t["start"],
            "end": t["end"],
            "summary": t.get("summary", "")
        })

    return chapters
