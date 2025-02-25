from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
from typing import Dict
from vosk import Model, KaldiRecognizer, SetLogLevel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize speech recognizer
try:
    SetLogLevel(-1)  # Reduce Vosk logging
    model = Model("vosk-model-small-en-us-0.15")
    logger.info("Speech recognizer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize speech recognizer: {e}")
    raise

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, KaldiRecognizer] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        # Initialize recognizer with correct sample rate
        recognizer = KaldiRecognizer(model, 16000)
        recognizer.SetWords(True)  # Enable word timing
        self.active_connections[websocket] = recognizer
        logger.info(f"New WebSocket connection established. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def process_audio(self, websocket: WebSocket, audio_data: bytes):
        recognizer = self.active_connections[websocket]
        if recognizer.AcceptWaveform(audio_data):
            result = json.loads(recognizer.Result())
            text = result.get("text", "").strip()
            if text:  # Only send non-empty results
                await websocket.send_json({
                    "status": "success",
                    "text": text,
                    "is_final": True
                })
        else:
            result = json.loads(recognizer.PartialResult())
            text = result.get("partial", "").strip()
            if text and len(text.split()) > 1:  # Only send if we have at least two words
                await websocket.send_json({
                    "status": "success",
                    "text": text,
                    "is_final": False
                })

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            audio_data = await websocket.receive_bytes()
            await manager.process_audio(websocket, audio_data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {e}")
        manager.disconnect(websocket)
        await websocket.close()

@app.get("/")
async def root():
    return {
        "message": "Transcription WebSocket Server",
        "status": "running",
        "endpoints": {
            "websocket": "/ws",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
