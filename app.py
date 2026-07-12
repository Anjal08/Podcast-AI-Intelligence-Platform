import os
import uvicorn
import gradio as gr
from main import app as fastapi_app

# Define a simple Gradio interface for status monitoring on Hugging Face
with gr.Blocks() as demo:
    gr.Markdown("# 🎙️ Podcast AI Intelligence Platform Backend")
    gr.Markdown("The backend API is running successfully. Connect your frontend to this Space URL.")

# Mount the Gradio UI onto our FastAPI app.
# Gradio is built on FastAPI, so mounting it is seamless.
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=False)