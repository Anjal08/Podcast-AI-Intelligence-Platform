# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (needed for audio processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Create a start script to run both FastAPI and Streamlit
RUN echo '#!/bin/bash\n\
uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
streamlit run app.py --server.port 7860 --server.address 0.0.0.0\n\
' > start.sh && chmod +x start.sh

# Expose the port Hugging Face expects
EXPOSE 7860

# Run the start script
CMD ["./start.sh"]