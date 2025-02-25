type TranscriptionCallback = (data: TranscriptionResponse) => void;
type StatusCallback = (isConnected: boolean) => void;

interface TranscriptionResponse {
    type: 'update' | 'partial';
    text: string;
    insights?: {
        insights: string[];
        questions: string[];
    };
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private onTranscriptionCallback: TranscriptionCallback | null = null;
    private onStatusCallback: StatusCallback | null = null;
    private reconnectTimeout: number | null = null;
    private readonly maxReconnectAttempts = 5;
    private reconnectAttempts = 0;
    private readonly reconnectDelay = 2000; // 2 seconds

    constructor() {
        this.connect();
        window.addEventListener('unload', () => this.disconnect());
    }

    private connect(): void {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection already in progress');
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        try {
            console.log('Attempting WebSocket connection...');
            this.ws = new WebSocket('ws://localhost:8000/ws');

            this.ws.onopen = () => {
                console.log('WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    window.clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
                this.onStatusCallback?.(true);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.ws = null;
                this.onStatusCallback?.(false);
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
                    this.reconnectTimeout = window.setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect();
                    }, this.reconnectDelay);
                }
            };

            this.ws.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
                this.onStatusCallback?.(false);
            };

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const data: TranscriptionResponse = JSON.parse(event.data);
                    console.log('Received WebSocket message:', data);
                    
                    if (this.onTranscriptionCallback) {
                        this.onTranscriptionCallback(data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.handleConnectionError();
        }
    }

    private handleConnectionError(): void {
        this.isConnected = false;
        this.ws = null;
        this.onStatusCallback?.(false);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectTimeout = window.setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, this.reconnectDelay);
        }
    }

    public sendAudioData(audioData: string): void {
        if (!this.ws || !this.isConnected) {
            console.warn('Cannot send audio data: WebSocket not connected');
            return;
        }

        try {
            this.ws.send(`data:audio/wav;base64,${audioData}`);
        } catch (error) {
            console.error('Error sending audio data:', error);
        }
    }

    public setTranscriptionCallback(callback: TranscriptionCallback | null): void {
        this.onTranscriptionCallback = callback;
    }

    public setStatusCallback(callback: StatusCallback | null): void {
        this.onStatusCallback = callback;
        if (callback) {
            callback(this.isConnected);
        }
    }

    public disconnect(): void {
        if (this.reconnectTimeout) {
            window.clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.ws) {
            try {
                this.ws.close();
            } catch (error) {
                console.error('Error closing WebSocket:', error);
            }
            this.ws = null;
        }
        
        this.isConnected = false;
        this.onTranscriptionCallback = null;
        this.onStatusCallback = null;
        this.reconnectAttempts = 0;
    }

    public isCurrentlyConnected(): boolean {
        return this.isConnected;
    }
}

export const webSocketService = new WebSocketService();
