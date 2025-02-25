# Overlay Transcription Backend

This is the backend service for the Overlay Transcription application, built with FastAPI, Vosk, and OpenAI integration.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download Vosk Model:
- Download the model from https://alphacephei.com/vosk/models
- Choose `vosk-model-small-en-us` for English
- Extract it to the backend directory

4. Create a `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the server:
```bash
python main.py
```

The server will start at http://localhost:8000

## API Endpoints

- `GET /`: Health check endpoint
- `POST /transcribe`: Transcribe audio to text
- `POST /process`: Process text using LLM

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for LLM processing
