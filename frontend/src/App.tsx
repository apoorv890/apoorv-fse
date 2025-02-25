import { useState, useEffect } from 'react';
import TranscriptionOverlay from './components/TranscriptionOverlay';
import { InsightsDisplay } from './components/InsightsDisplay';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import './App.css';

function App() {
  const [transcriptionText, setTranscriptionText] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8000/ws');
  const { startRecording, stopRecording, isRecording } = useAudioRecorder({
    onAudioData: (audioData) => {
      console.log('Audio data received, sending to WebSocket...');
      if (readyState === WebSocket.OPEN) {
        try {
          // Create the message object
          const message = {
            type: 'audio',
            data: audioData
          };
          console.log('Sending audio data to WebSocket');
          sendMessage(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending audio data:', error);
        }
      } else {
        console.warn('WebSocket not connected. Ready state:', readyState);
      }
    },
  });

  useEffect(() => {
    if (lastMessage) {
      try {
        console.log('Received WebSocket message:', lastMessage);
        const data = JSON.parse(lastMessage);
        console.log('Parsed message data:', data);
        
        if (data.type === 'update' || data.type === 'partial') {
          console.log('Setting transcription text:', data.text);
          setTranscriptionText(data.text || '');
          
          if (data.insights) {
            console.log('Setting insights:', data.insights);
            setInsights(data.insights.insights || []);
            setQuestions(data.insights.questions || []);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen">
      <TranscriptionOverlay
        transcriptionText={transcriptionText}
      />
      
      <InsightsDisplay
        insights={insights}
        questions={questions}
      />
      
      <button
        onClick={async () => {
          try {
            if (isRecording) {
              console.log('Stopping recording...');
              stopRecording();
            } else {
              console.log('Starting recording...');
              await startRecording();
              console.log('Recording started successfully');
            }
          } catch (error) {
            console.error('Error toggling recording:', error);
          }
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          background: isRecording ? '#e03131' : '#2b8a3e',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
        }}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}

export default App;
