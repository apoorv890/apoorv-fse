import os
import sys
import urllib.request
import zipfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
MODEL_PATH = "vosk-model-small-en-us-0.15"

def download_model():
    """Download and extract the Vosk model if it doesn't exist."""
    if os.path.exists(MODEL_PATH):
        logger.info(f"Model already exists at {MODEL_PATH}")
        return

    zip_path = f"{MODEL_PATH}.zip"
    
    # Download the model
    logger.info(f"Downloading model from {MODEL_URL}")
    urllib.request.urlretrieve(MODEL_URL, zip_path)
    
    # Extract the model
    logger.info("Extracting model...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('.')
    
    # Remove the zip file
    os.remove(zip_path)
    logger.info(f"Model downloaded and extracted to {MODEL_PATH}")

if __name__ == "__main__":
    try:
        download_model()
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        sys.exit(1)
