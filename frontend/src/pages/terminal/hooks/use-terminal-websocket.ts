import { useCallback, useEffect, useRef, useState } from 'react';
import type { Terminal } from 'xterm';
import type { FitAddon } from 'xterm-addon-fit';

import { HostApi } from '@/api/constants';
import { useUserToken } from '@/store/user';

import type { ConnectionStatus } from '../components/types';

const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_TIMEOUT = 10_000;
const RECONNECT_BASE_DELAY = 1_000;
const RECONNECT_MAX_DELAY = 30_000;
const MAX_RECONNECT_ATTEMPTS = 3;

interface UseTerminalWebSocketOptions {
  hostId: string;
  term: Terminal | null;
  fitAddon: FitAddon | null;
  enabled: boolean;
}

export function useTerminalWebSocket({
  hostId,
  term,
  fitAddon,
  enabled,
}: UseTerminalWebSocketOptions) {
  const { accessToken } = useUserToken();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptRef = useRef(0);
  const isManualDisconnectRef = useRef(false);
  const dataDisposableRef = useRef<{ dispose: () => void } | null>(null);

  // Use refs for values that connect() reads but shouldn't trigger re-creation
  const termRef = useRef(term);
  const fitAddonRef = useRef(fitAddon);
  const enabledRef = useRef(enabled);
  const hostIdRef = useRef(hostId);
  const accessTokenRef = useRef(accessToken);

  termRef.current = term;
  fitAddonRef.current = fitAddon;
  enabledRef.current = enabled;
  hostIdRef.current = hostId;
  accessTokenRef.current = accessToken;

  const cleanup = useCallback(() => {
    clearInterval(heartbeatRef.current);
    clearTimeout(heartbeatTimeoutRef.current);
    clearTimeout(reconnectTimerRef.current);
    dataDisposableRef.current?.dispose();
    dataDisposableRef.current = null;
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, []);

  const sendResize = useCallback((rows: number, cols: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(`\x1b[8;${rows},${cols}`);
    }
  }, []);

  // Stable connect function — reads from refs, no dependency churn
  const connect = useCallback(
    (isReconnect = false) => {
      const t = termRef.current;
      const token = accessTokenRef.current;
      const hid = hostIdRef.current;
      const fa = fitAddonRef.current;

      if (!t || !token || !hid) return;

      cleanup();
      setStatus(isReconnect ? 'reconnecting' : 'connecting');

      if (isReconnect) {
        t.write('\x1b[2J\x1b[H');
      }

      const wsUrl = `${import.meta.env.VITE_APP_WS_API}${HostApi.Terminal.replace(':id', hid)}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const resetHeartbeatTimeout = () => {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = setTimeout(() => {
          ws.close();
        }, HEARTBEAT_TIMEOUT);
      };

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptRef.current = 0;
        isManualDisconnectRef.current = false;

        if (fa) fa.fit();
        const dims = `${t.rows},${t.cols}`;
        ws.send(`\x1b[8;${dims}`);

        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('\x00');
            resetHeartbeatTimeout();
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        clearTimeout(heartbeatTimeoutRef.current);
        if (
          event.data === '\x00' ||
          (event.data instanceof Uint8Array && event.data.length === 1 && event.data[0] === 0)
        ) {
          return;
        }
        t.write(event.data);
      };

      ws.onerror = () => {
        clearInterval(heartbeatRef.current);
        clearTimeout(heartbeatTimeoutRef.current);
      };

      ws.onclose = () => {
        setStatus('disconnected');
        clearInterval(heartbeatRef.current);
        clearTimeout(heartbeatTimeoutRef.current);

        if (isManualDisconnectRef.current) return;

        if (enabledRef.current && reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            RECONNECT_BASE_DELAY * 2 ** reconnectAttemptRef.current,
            RECONNECT_MAX_DELAY,
          );
          reconnectAttemptRef.current += 1;
          setStatus('reconnecting');
          t.writeln(
            `\r\n\x1b[33m连接已断开，${(delay / 1000).toFixed(0)}s 后自动重连...\x1b[0m`,
          );
          reconnectTimerRef.current = setTimeout(() => connect(true), delay);
        } else if (!enabledRef.current) {
          // Tab inactive, don't reconnect
        } else {
          t.writeln('\r\n\x1b[33m自动重连已达上限，请手动重连\x1b[0m');
        }
      };

      dataDisposableRef.current = t.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    },
    [cleanup],
  );

  const reconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    reconnectAttemptRef.current = 0;
    cleanup();

    const t = termRef.current;
    if (t) {
      t.clear();
      t.reset();
      t.write('\x1b[33m正在重新连接...\x1b[0m');
    }

    setTimeout(() => {
      isManualDisconnectRef.current = false;
      connect(true);
    }, 100);
  }, [cleanup, connect]);

  // Connect once when term becomes available
  useEffect(() => {
    if (enabled && term) {
      connect();
    }
    return () => {
      isManualDisconnectRef.current = true;
      cleanup();
    };
    // Only re-run when term or hostId actually changes — not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, hostId]);

  return { status, reconnect, sendResize };
}
