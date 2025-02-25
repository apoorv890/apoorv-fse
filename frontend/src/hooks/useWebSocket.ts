import { useState, useEffect, useCallback } from 'react';

interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  readyState: number;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('WebSocket Connected');
      setReadyState(WebSocket.OPEN);
    };

    websocket.onmessage = (event) => {
      setLastMessage(event.data);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setReadyState(WebSocket.CLOSED);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: string) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        console.warn('WebSocket is not connected');
      }
    },
    [ws]
  );

  return { sendMessage, lastMessage, readyState };
};
