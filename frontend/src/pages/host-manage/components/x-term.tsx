import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Terminal as XTerm, ITheme } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

export interface TerminalRef {
  clear: () => void;
  reconnect: () => void;
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
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm>();
    const wsRef = useRef<WebSocket>();
    const fitAddonRef = useRef<FitAddon>();
    // WebSocket 连接函数
    const setupWebSocket = (
      term: XTerm,
      hostId: string,
      onConnectionChange?: (connected: boolean) => void,
      isReconnect = false,
    ) => {
      term.clear();
      term.reset();

      const ws = new WebSocket(`${import.meta.env.VITE_APP_WS_API}/api/host_web_shell/${hostId}`);
      let heartbeatInterval: NodeJS.Timeout;
      let missedHeartbeats = 0;

      const sendHeartbeat = () => {
        if (ws.readyState === WebSocket.OPEN) {
          missedHeartbeats += 1;
          if (missedHeartbeats > 3) {
            term.writeln('\r\n\x1b[33m连接似乎已断开，正在尝试重新连接...\x1b[0m\r\n');
            ws.close();
            return;
          }
          ws.send('\x00');
        }
      };

      ws.onopen = () => {
        onConnectionChange?.(true);
        if (isReconnect) {
          term.write('\x1b[2J\x1b[H');
        }
        const dims = `${term.rows},${term.cols}`;
        ws.send(`\x1b[8;${dims}`);
        heartbeatInterval = setInterval(sendHeartbeat, 30000);
      };

      ws.onmessage = (event) => {
        if (
          event.data === '\x00' ||
          (event.data instanceof Uint8Array && event.data.length === 1 && event.data[0] === 0)
        ) {
          missedHeartbeats = 0;
          return;
        }
        term.write(event.data);
      };

      ws.onerror = () => {
        onConnectionChange?.(false);
        clearInterval(heartbeatInterval);
      };

      ws.onclose = () => {
        onConnectionChange?.(false);
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
    };
    // 初始化终端和连接
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
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const dims = `${term.rows},${term.cols}`;
            wsRef.current.send(`\x1b[8;${dims}`);
          }
        }
      };

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      window.addEventListener('resize', handleResize);

      // 初始化 WebSocket 连接
      const { ws, cleanup } = setupWebSocket(term, hostId, onConnectionChange);
      wsRef.current = ws;

      function cleanupEffect() {
        cleanup();
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
        webLinksAddon.dispose();
        fitAddon.dispose();
        term.dispose();
      }

      return cleanupEffect;
    }, [hostId, onConnectionChange]);

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
    }));

    return <div ref={terminalRef} className={`${className} w-full overflow-hidden`} />;
  },
);
