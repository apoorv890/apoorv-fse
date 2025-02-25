import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface TranscriptionOverlayProps {
  transcriptionText: string;
}

const OverlayContainer = styled.div`
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 9999;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const TranscriptionBox = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.5;
  color: #343a40;
  white-space: pre-wrap;
  word-break: break-word;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #adb5bd;
    border-radius: 4px;
    
    &:hover {
      background: #868e96;
    }
  }
`;

const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({
  transcriptionText,
}) => {
  const transcriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new content arrives
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [transcriptionText]);

  return (
    <OverlayContainer>
      <TranscriptionBox ref={transcriptionRef}>
        {transcriptionText || 'Waiting for speech...'}
      </TranscriptionBox>
    </OverlayContainer>
  );
};

export default TranscriptionOverlay;
