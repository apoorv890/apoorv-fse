from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import base64
import numpy as np
from vosk import Model, KaldiRecognizer
from services.insights_service import InsightsService
from services.storage_service import StorageService
import logging
from fastapi.websockets import WebSocketDisconnect
import uuid
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
insights_service = InsightsService()
storage_service = StorageService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = Model("vosk-model-small-en-us")
    logger.info("Vosk model loaded successfully")
except Exception as e:
    logger.error(f"Error loading Vosk model: {e}")
    raise

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    current_text = ""
    recognizer = KaldiRecognizer(model, 16000)
    
    logger.info("New transcription session started")
    
    try:
        while True:
            try:
                message = await websocket.receive_text()
                logger.info("Received message")
                
                try:
                    data = json.loads(message)
                    logger.info(f"Message type: {data.get('type')}")
                    
                    if data.get('type') != 'audio' or not data.get('data'):
                        logger.warning("Invalid message format")
                        continue
                    
                    # Get the audio data
                    audio_base64 = data['data']
                    
                    # Decode base64 data
                    audio_data = base64.b64decode(audio_base64)
                    
                    # Convert to numpy array and ensure it's 16-bit PCM
                    audio_np = np.frombuffer(audio_data, dtype=np.int16)
                    
                    if recognizer.AcceptWaveform(audio_np.tobytes()):
                        result = json.loads(recognizer.Result())
                        text = result.get("text", "").strip()
                        logger.info(f"Transcribed text: {text}")
                        
                        if text:
                            current_text += " " + text
                            current_text = current_text.strip()
                            
                            try:
                                # Generate insights for every transcription update
                                insights = await insights_service.generate_insights(current_text)
                                logger.info("Generated insights successfully")
                                
                                # Save to database with insights
                                await storage_service.save_transcription(
                                    transcription_text=current_text,
                                    ai_insights=insights.insights,
                                    ai_questions=insights.questions
                                )
                                
                                # Send to client
                                await websocket.send_json({
                                    "type": "update",
                                    "text": current_text,
                                    "insights": insights.dict()
                                })
                            except Exception as e:
                                logger.error(f"Error generating insights: {e}")
                                # Save to database without insights
                                await storage_service.save_transcription(
                                    transcription_text=current_text
                                )
                                # Send just the transcription
                                await websocket.send_json({
                                    "type": "update",
                                    "text": current_text
                                })
                    else:
                        partial = json.loads(recognizer.PartialResult())
                        if partial.get("partial", "").strip():
                            await websocket.send_json({
                                "type": "partial",
                                "text": current_text + " " + partial["partial"]
                            })
                            
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding message: {e}")
                    continue
                    
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(f"Error in websocket loop: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("Closing WebSocket connection")

# Add REST endpoints for retrieving transcriptions
@app.get("/transcriptions")
async def get_transcriptions(limit: int = 100, offset: int = 0):
    return await storage_service.get_transcriptions(limit, offset)

@app.get("/transcriptions/{transcription_id}")
async def get_transcription(transcription_id: int):
    return await storage_service.get_transcription(transcription_id)

@app.get("/transcriptions/search")
async def search_transcriptions(query: str, limit: int = 100, offset: int = 0):
    return await storage_service.search_transcriptions(query, limit, offset)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
