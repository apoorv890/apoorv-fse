import { useState, useCallback, useRef } from 'react';

interface UseAudioRecorderProps {
  onAudioData: (audioData: string) => void;
}

interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
}

export const useAudioRecorder = ({ onAudioData }: UseAudioRecorderProps): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioWorklet = useRef<AudioWorkletNode | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (audioWorklet.current) {
      audioWorklet.current.disconnect();
      audioWorklet.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }

    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
      stream.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          volume: 1.0
        }
      });
      
      // Initialize AudioContext
      audioContext.current = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });
      
      try {
        // Load the worklet from the public directory
        const workletUrl = new URL('/audio-processor.worklet.js', window.location.origin);
        await audioContext.current.audioWorklet.addModule(workletUrl.href);
        
        audioWorklet.current = new AudioWorkletNode(
          audioContext.current,
          'audio-processor',
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 1,
            processorOptions: {
              sampleRate: audioContext.current.sampleRate
            }
          }
        );

        // Handle messages from the audio worklet
        audioWorklet.current.port.onmessage = (event) => {
          if (event.data.type === 'audio') {
            const audioData = event.data.data;
            const base64Data = btoa(
              String.fromCharCode.apply(null, new Uint8Array(audioData))
            );
            onAudioData(base64Data);
          }
        };

        // Connect the audio nodes
        const source = audioContext.current.createMediaStreamSource(stream.current);
        source.connect(audioWorklet.current);
        audioWorklet.current.connect(audioContext.current.destination);

        setIsRecording(true);
      } catch (error) {
        console.warn('Audio worklet failed, falling back to MediaRecorder:', error);
        
        // Fallback to MediaRecorder
        mediaRecorder.current = new MediaRecorder(stream.current);
        
        mediaRecorder.current.ondataavailable = (event) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              const base64Data = (reader.result as string).split(',')[1];
              onAudioData(base64Data);
            }
          };
          reader.readAsDataURL(event.data);
        };

        mediaRecorder.current.start(100);
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      stopRecording();
      throw error;
    }
  }, [onAudioData, stopRecording]);

  return {
    startRecording,
    stopRecording,
    isRecording,
  };
};
