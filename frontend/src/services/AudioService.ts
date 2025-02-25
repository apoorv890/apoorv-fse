import { webSocketService } from './WebSocketService';

interface AudioWorkletProcessorMessage {
    type: 'audio-data';
    data: ArrayBuffer;
}

class AudioService {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private isRecording = false;

    async startRecording(): Promise<void> {
        if (this.isRecording) return;

        try {
            // Request microphone access with specific constraints
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // Create audio context with specific sample rate
            this.audioContext = new AudioContext({
                sampleRate: 16000,
                latencyHint: 'interactive'
            });

            console.log('Loading audio worklet...');
            try {
                // Try loading from different possible paths
                const possiblePaths = [
                    '/audio-processor.worklet.js',
                    '/src/services/audio-processor.worklet.js',
                    './audio-processor.worklet.js',
                    '../services/audio-processor.worklet.js'
                ];

                let loaded = false;
                for (const path of possiblePaths) {
                    try {
                        await this.audioContext.audioWorklet.addModule(path);
                        console.log('Audio worklet loaded successfully from:', path);
                        loaded = true;
                        break;
                    } catch (e) {
                        console.warn(`Failed to load worklet from ${path}:`, e);
                    }
                }

                if (!loaded) {
                    throw new Error('Failed to load audio worklet from any path');
                }
            } catch (error) {
                console.error('All attempts to load audio worklet failed:', error);
                throw error;
            }

            // Create and connect audio processing pipeline
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                channelCount: 1,
                processorOptions: {
                    sampleRate: this.audioContext.sampleRate
                }
            });

            // Handle audio data from the worklet
            this.workletNode.port.onmessage = (event: MessageEvent<AudioWorkletProcessorMessage>) => {
                if (!this.isRecording) return;
                
                if (event.data.type === 'audio-data') {
                    try {
                        // Convert the audio data to base64
                        const base64Data = this.arrayBufferToBase64(event.data.data);
                        
                        // Send to WebSocket
                        if (webSocketService.isCurrentlyConnected()) {
                            webSocketService.sendAudioData(base64Data);
                        } else {
                            console.warn('WebSocket not connected, audio data discarded');
                        }
                    } catch (error) {
                        console.error('Error processing audio data:', error);
                    }
                }
            };

            // Connect source to worklet only (don't connect to destination to prevent echo)
            source.connect(this.workletNode);

            this.isRecording = true;
            console.log('Recording started successfully');
        } catch (error) {
            console.error('Error starting recording:', error);
            this.cleanup();
            throw error;
        }
    }

    stopRecording(): void {
        if (!this.isRecording) return;
        console.log('Stopping recording...');
        
        this.isRecording = false;
        this.cleanup();
        console.log('Recording stopped successfully');
    }

    private cleanup(): void {
        try {
            if (this.workletNode) {
                this.workletNode.disconnect();
                this.workletNode = null;
            }

            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Audio track stopped');
                });
                this.stream = null;
            }

            if (this.audioContext) {
                this.audioContext.close().catch(console.error);
                this.audioContext = null;
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        let binary = '';
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    isCurrentlyRecording(): boolean {
        return this.isRecording;
    }
}

export const audioService = new AudioService();
