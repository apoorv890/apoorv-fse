import os
import json
import base64
import numpy as np
from vosk import Model, KaldiRecognizer
import sounddevice as sd

class SpeechRecognizer:
    def __init__(self, model_path: str = "vosk-model-small-en-us"):
        # Download model if not exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Please download the Vosk model from https://alphacephei.com/vosk/models "
                f"and extract it to {model_path}"
            )
        
        self.model = Model(model_path)
        self.sample_rate = 16000

    async def transcribe(self, audio_data: str, language: str = "en-US") -> str:
        """
        Transcribe base64 encoded audio data to text
        """
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
            
            # Create recognizer
            recognizer = KaldiRecognizer(self.model, self.sample_rate)
            recognizer.AcceptWaveform(audio_array.tobytes())
            
            # Get result
            result = json.loads(recognizer.FinalResult())
            return result.get("text", "")
            
        except Exception as e:
            raise Exception(f"Error in transcription: {str(e)}")

    def list_audio_devices(self):
        """List available audio input devices"""
        return sd.query_devices()
