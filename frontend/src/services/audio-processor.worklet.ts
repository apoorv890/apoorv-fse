/// <reference lib="webworker" />

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new(): AudioWorkletProcessor;
};

declare interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

interface AudioProcessorMessage {
    type: 'audio-data';
    data: ArrayBuffer;
}

class AudioProcessor extends AudioWorkletProcessor {
    private readonly bufferSize = 1024;
    private readonly sampleRate = 16000;
    private audioData: Float32Array[] = [];
    private readonly maxBufferSize: number;

    constructor() {
        super();
        // Calculate how many buffers we need for 1 second of audio
        this.maxBufferSize = Math.ceil(this.sampleRate / this.bufferSize);
    }

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean {
        // Get the first input's first channel
        const input = inputs[0];
        if (!input?.length || !input[0]?.length) {
            return true;
        }

        const inputChannel = input[0];
        
        // Store the audio data
        this.audioData.push(new Float32Array(inputChannel));

        // When we have enough data (approximately 1 second of audio), process it
        if (this.audioData.length >= this.maxBufferSize) {
            try {
                this.processAudioData();
            } catch (error) {
                console.error('Error processing audio data:', error);
            }
            // Clear the buffer after processing
            this.audioData = [];
        }

        // Copy input to output to maintain audio chain
        for (let channelIndex = 0; channelIndex < outputs.length; channelIndex++) {
            const output = outputs[channelIndex];
            const inputChannel = input[channelIndex];
            if (output?.[0] && inputChannel) {
                output[0].set(inputChannel);
            }
        }

        return true;
    }

    private processAudioData(): void {
        // Concatenate all audio buffers
        const totalLength = this.audioData.reduce((acc, curr) => acc + curr.length, 0);
        const concatenated = new Float32Array(totalLength);
        let offset = 0;
        
        for (const buffer of this.audioData) {
            concatenated.set(buffer, offset);
            offset += buffer.length;
        }

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(concatenated.length);
        for (let i = 0; i < concatenated.length; i++) {
            const s = Math.max(-1, Math.min(1, concatenated[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send the processed audio data to the main thread
        this.port.postMessage({
            type: 'audio-data',
            data: pcmData.buffer
        }, [pcmData.buffer]);
    }
}

registerProcessor('audio-processor', AudioProcessor);
