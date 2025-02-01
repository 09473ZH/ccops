import { useCallback, useEffect, useState, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import useUserStore from '@/store/userStore';

import type { TaskOutput } from '../api/services/taskService';

interface UseTaskWebSocketOptions {
  taskId: number | null;
  autoClear?: boolean;
  withTimestamp?: boolean;
  preserveFormat?: boolean;
  onMessage?: (data: TaskOutput) => void;
  onError?: (error: string) => void;
}

export function useTaskWebSocket({
  taskId,
  autoClear = false,
  withTimestamp = false,
  preserveFormat = false,
  onMessage,
  onError,
}: UseTaskWebSocketOptions) {
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { userToken } = useUserStore();
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  // 更新 ref
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  const socketUrl =
    taskId && userToken.accessToken
      ? `${import.meta.env.VITE_APP_WS_API}/api/task/${taskId}/message?token=${encodeURIComponent(
          userToken.accessToken,
        )}`
      : null;

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    onErrorRef.current?.(errorMessage);
  }, []);

  const { lastMessage, readyState } = useWebSocket(
    socketUrl || '',
    {
      shouldReconnect: (closeEvent) => {
        return closeEvent.code !== 1000; // 正常关闭时不重连
      },
      retryOnError: true,
      reconnectAttempts: 3, // 最大重连次数
      reconnectInterval: 3000, // 重连间隔时间
      onOpen: () => {
        setError(null);
      },
      onError: () => {
        handleError('连接失败，请检查网络连接或刷新页面重试');
      },
      onClose: (event) => {
        if (event.code === 1006) {
          handleError('连接异常断开，请刷新页面重试');
        }
      },
      onMessage: (event) => {
        try {
          JSON.parse(event.data);
        } catch (error) {
          // 忽略解析错误
        }
      },
    },
    Boolean(socketUrl),
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
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
        // 先处理消息事件
        onMessageRef.current?.(data);

        // 再处理消息内容
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
        console.debug('Invalid message format:', error);
      }
    }
  }, [lastMessage, withTimestamp, preserveFormat]);

  return {
    messages,
    clearMessages,
    error,
    isConnected: readyState === ReadyState.OPEN,
    isConnecting: readyState === ReadyState.CONNECTING,
    connectionStatus: readyState,
  };
}
