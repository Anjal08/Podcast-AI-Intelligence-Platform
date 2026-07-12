# Execution Workflow: Step-by-Step

This document explains the exact lifecycle of an audio file from the moment the user clicks "Upload" to the final AI Insights dashboard.

## 1. Upload Phase
1. User drops an audio file into the React frontend (`/upload`).
2. Frontend sends a `multipart/form-data` POST request to `/analyze`.
3. FastAPI receives the file, generates a unique `task_id` (UUID), saves the file to `temp_uploads/`, and immediately returns the `task_id` to the frontend.
4. FastAPI spins up a background worker `process_podcast_task()` to handle the heavy lifting.
5. The frontend begins polling `/status/{task_id}` every few seconds to update the UI progress bar.

## 2. Preprocessing (`core/preprocess.py`)
1. The background worker picks up the file.
2. It uses `ffmpeg` to convert the audio into a mono (1 channel), 16kHz WAV file.
* **Why?** Audio models like Whisper are trained on 16kHz mono audio. Preprocessing prevents the model from having to downsample on the fly, saving RAM and increasing stability.

## 3. Transcription (`core/transcription.py`)
1. The clean WAV file is passed to OpenAI's Whisper model.
2. Whisper transcribes the audio, returning the full text and an array of individual sentences.
3. Critically, Whisper attaches exact `start` and `end` timestamps (in seconds) to every sentence. This is what powers the interactive frontend timeline.

## 4. Vectorization (`core/embeddings.py`)
1. We take the list of transcribed sentences.
2. Using HuggingFace's `sentence-transformers`, we convert every sentence into a high-dimensional vector (a list of floating-point numbers).
3. These vectors capture the semantic "meaning" of the sentence.

## 5. Topic Segmentation (`core/topic_segmentation.py`)
*This is the most mathematically complex part of the app.*
1. The app loops through the sentences.
2. It calculates the **Cosine Similarity** between Sentence A and Sentence B.
3. If the sentences are discussing the same thing, the similarity score is high (e.g., 0.8).
4. If the conversation shifts to a completely new topic, the similarity score drops dramatically (e.g., 0.2).
5. We set a threshold. Whenever the score drops below that threshold, we draw a line and say: "A new chapter starts here."
6. We group the sentences into these "chapters" or "segments."

## 6. Insights & Summarization (`main.py` / `core/summarizer.py`)
1. Now that we have grouped chapters, we send the text of each chapter to an LLM (Groq Llama-3).
2. The LLM generates a concise summary and a short, catchy label for each chapter.
3. We run `TextBlob` over the summaries to determine the Sentiment (Positive, Negative, Neutral).

## 7. Completion
1. The background task marks its status as `"completed"`.
2. It bundles the transcript, chapters, summaries, and vector embeddings into a JSON object.
3. The frontend's next poll hits the API, sees `"completed"`, downloads the JSON payload, and renders the Dashboard!
