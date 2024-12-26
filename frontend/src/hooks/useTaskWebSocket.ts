import { useCallback, useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import type { TaskOutput } from '../api/services/taskService';

interface UseTaskWebSocketOptions {
  taskId: number | null;
  autoClear?: boolean;
  withTimestamp?: boolean;
  preserveFormat?: boolean;
  onMessage?: (data: TaskOutput) => void;
}

export function useTaskWebSocket({
  taskId,
  autoClear = false,
  withTimestamp = false,
  preserveFormat = false,
  onMessage,
}: UseTaskWebSocketOptions) {
  const [messages, setMessages] = useState<string[]>([]);
  const socketUrl = taskId ? `${import.meta.env.VITE_APP_WS_API}/api/task/${taskId}/message` : null;

  const { lastMessage, readyState } = useWebSocket(
    socketUrl || '',
    {
      shouldReconnect: (closeEvent) => {
        return closeEvent.code !== 1000 && Boolean(socketUrl);
      },
      reconnectAttempts: 3,
      reconnectInterval: 3000,
      filter: (message) => {
        try {
          const data = JSON.parse(message.data);
          return Boolean(data.message?.trim());
        } catch {
          return false;
        }
      },
    },
    Boolean(socketUrl),
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (autoClear) {
      clearMessages();
    }
  }, [taskId, clearMessages, autoClear]);

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data) as TaskOutput;
        onMessage?.(data);

        if (data.message?.trim()) {
          let { message } = data;
          if (!preserveFormat) {
            message = message.replace(/\s+/g, ' ').trim();
          }
          const formattedMessage = withTimestamp
            ? `[${new Date().toLocaleTimeString()}] ${message}`
            : message;
          setMessages((prev) => [...prev, formattedMessage]);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, withTimestamp, preserveFormat, onMessage]);

  return {
    messages,
    clearMessages,
    isConnected: readyState === ReadyState.OPEN,
    isConnecting: readyState === ReadyState.CONNECTING,
    connectionStatus: readyState,
  };
}
