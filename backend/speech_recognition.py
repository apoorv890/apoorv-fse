from vosk import Model, KaldiRecognizer
import json
import wave
import os
from typing import Optional
import logging

class SpeechRecognizer:
    def __init__(self, model_path: str = "vosk-model-small-en-us-0.15"):
        self.model_path = model_path
        self._load_model()
        self.sample_rate = 16000  # Vosk works best with 16kHz audio

    def _load_model(self):
        """Load the Vosk model from the specified path."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Vosk model not found at {self.model_path}. Please download it from https://alphacephei.com/vosk/models"
            )
        self.model = Model(self.model_path)
        logging.info(f"Loaded Vosk model from {self.model_path}")

    def create_recognizer(self) -> KaldiRecognizer:
        """Create a new KaldiRecognizer instance."""
        return KaldiRecognizer(self.model, self.sample_rate)

    def process_audio_chunk(self, recognizer: KaldiRecognizer, audio_chunk: bytes) -> Optional[str]:
        """Process a chunk of audio data and return transcribed text if available."""
        if recognizer.AcceptWaveform(audio_chunk):
            result = json.loads(recognizer.Result())
            return result.get("text", "").strip()
        else:
            # Partial result
            result = json.loads(recognizer.PartialResult())
            return result.get("partial", "").strip()

    def reset_recognizer(self, recognizer: KaldiRecognizer):
        """Reset the recognizer state."""
        recognizer.Reset()
