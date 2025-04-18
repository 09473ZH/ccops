import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react';
import { Terminal as XTerm, ITheme } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

import { HostApi } from '@/api/constants';
import { useUserToken } from '@/store/user';

export interface TerminalRef {
  clear: () => void;
  reconnect: () => void;
  reset: () => void;
  fit: () => void;
}

interface TerminalProps {
  className?: string;
  fontSize: number;
  fontFamily: string;
  theme: ITheme;
  onConnectionChange?: (connected: boolean) => void;
  hostId: string;
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(
  ({ className, fontSize, fontFamily, theme, onConnectionChange, hostId }, ref) => {
    const { accessToken } = useUserToken();
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm>();
    const wsRef = useRef<WebSocket>();
    const fitAddonRef = useRef<FitAddon>();
    const isManualReconnectRef = useRef(false);

    const setupWebSocket = useCallback(
      (
        term: XTerm,
        hostId: string,
        onConnectionChange?: (connected: boolean) => void,
        isReconnect = false,
      ) => {
        term.clear();
        term.reset();

        const ws = new WebSocket(
          `${import.meta.env.VITE_APP_WS_API}${HostApi.Terminal.replace(
            ':id',
            hostId,
          )}?token=${accessToken}`,
        );
        let heartbeatInterval: NodeJS.Timeout;

        ws.onopen = () => {
          onConnectionChange?.(true);
          isManualReconnectRef.current = false;

          if (isReconnect) {
            term.write('\x1b[2J\x1b[H');
          }
          const dims = `${term.rows},${term.cols}`;
          ws.send(`\x1b[8;${dims}`);
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('\x00');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (
            event.data === '\x00' ||
            (event.data instanceof Uint8Array && event.data.length === 1 && event.data[0] === 0)
          ) {
            return;
          }
          term.write(event.data);
        };

        ws.onerror = () => {
          onConnectionChange?.(false);
          term.writeln('\r\n\x1b[33m连接出错，请点击"重新连接"按钮尝试重新连接\x1b[0m\r\n');
          clearInterval(heartbeatInterval);
        };

        ws.onclose = () => {
          onConnectionChange?.(false);
          if (!isManualReconnectRef.current) {
            term.writeln('\r\n\x1b[33m连接已关闭，请点击"重新连接"按钮重新连接\x1b[0m\r\n');
          }
          clearInterval(heartbeatInterval);
        };

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        return {
          ws,
          cleanup: () => {
            clearInterval(heartbeatInterval);
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          },
        };
      },
      [accessToken],
    );

    useEffect(() => {
      if (!terminalRef.current) return undefined;

      // 使用默认配置初始化
      const term = new XTerm({
        cursorBlink: true,
        allowTransparency: true,
        cursorStyle: 'block',
        scrollback: 800,
        convertEol: true,
        cols: 120,
        rows: 40,
        lineHeight: 1,
        letterSpacing: 0,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.open(terminalRef.current);
      fitAddon.fit();

      // 处理终端大小调整
      const handleResize = () => {
        if (fitAddonRef.current && terminalRef.current?.offsetParent !== null) {
          fitAddonRef.current.fit();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const dims = `${xtermRef.current?.rows},${xtermRef.current?.cols}`;
            wsRef.current.send(`\x1b[8;${dims}`);
          }
        }
      };

      const resizeObserver = new ResizeObserver(() => {
        if (terminalRef.current?.offsetParent !== null) {
          handleResize();
        }
      });

      resizeObserver.observe(terminalRef.current);
      window.addEventListener('resize', handleResize);

      // 初始化 WebSocket 连接
      const { ws, cleanup } = setupWebSocket(term, hostId, onConnectionChange);
      wsRef.current = ws;

      return () => {
        // 简化的清理逻辑
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        cleanup();

        // 一步完成终端实例销毁
        xtermRef.current?.dispose();
        xtermRef.current = undefined;
      };
    }, [hostId, onConnectionChange, setupWebSocket]);

    useEffect(() => {
      const term = xtermRef.current;
      if (!term) return;

      term.options.fontSize = fontSize;
      term.options.fontFamily = fontFamily;
      term.options.theme = theme;
      fitAddonRef.current?.fit();
    }, [fontSize, fontFamily, theme]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        xtermRef.current?.clear();
      },
      reconnect: () => {
        const term = xtermRef.current;
        if (!term) return;

        // 设置手动重连标志，防止关闭旧连接时显示"连接已关闭"的提示
        isManualReconnectRef.current = true;

        // 关闭现有连接
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = undefined;
        }

        // 立即重新连接
        term.clear();
        term.reset();
        term.write('\x1b[33m正在重新连接...\x1b[0m');
        const { ws } = setupWebSocket(term, hostId, onConnectionChange, true);
        wsRef.current = ws;
      },
      reset: () => {
        xtermRef.current?.reset();
      },
      fit: () => {
        fitAddonRef.current?.fit();
      },
    }));

    return <div ref={terminalRef} className={`${className} w-full overflow-hidden`} />;
  },
);
