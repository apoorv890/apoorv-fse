class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._initBuffer();
  }

  _initBuffer() {
    this._bytesWritten = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input.length) return true;

    const channel = input[0];
    
    // Accumulate audio data
    for (let i = 0; i < channel.length; i++) {
      if (this._bytesWritten < this._bufferSize) {
        this._buffer[this._bytesWritten] = channel[i];
        this._bytesWritten += 1;
      }
    }

    // If we have enough data, send it to the main thread
    if (this._bytesWritten >= this._bufferSize) {
      const audioData = this._buffer.slice(0, this._bytesWritten);
      
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Send the PCM data to the main thread
      this.port.postMessage({
        type: 'audio',
        data: pcmData.buffer
      }, [pcmData.buffer]);

      this._initBuffer();
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
