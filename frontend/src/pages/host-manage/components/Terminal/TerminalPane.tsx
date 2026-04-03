import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { Terminal as XTerm } from 'xterm';
import type { FitAddon } from 'xterm-addon-fit';

import { cn } from '@/utils';

import { useTerminalWebSocket } from '../../hooks/features/use-terminal-websocket';

import { Terminal, type TerminalRef } from './index';
import type { TerminalPaneProps } from './types';

export interface TerminalPaneHandle {
  clear: () => void;
  reconnect: () => void;
  fit: () => void;
}

// Global registry so parent can call methods on any pane by ID
const paneRegistry = new Map<string, TerminalPaneHandle>();

export function getPaneHandle(paneId: string): TerminalPaneHandle | undefined {
  return paneRegistry.get(paneId);
}

export const TerminalPane = memo(function TerminalPane({
  paneId,
  hostId,
  isActive,
  isSplit,
  fontSize,
  fontFamily,
  theme,
  onFocus,
}: TerminalPaneProps) {
  const terminalRef = useRef<TerminalRef>(null);
  const [term, setTerm] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);

  const { reconnect, sendResize } = useTerminalWebSocket({
    hostId,
    term,
    fitAddon,
    enabled: true,
  });

  const handleTermReady = useCallback((t: XTerm, fa: FitAddon) => {
    setTerm(t);
    setFitAddon(fa);
  }, []);

  const handleResize = useCallback(
    (rows: number, cols: number) => {
      sendResize(rows, cols);
    },
    [sendResize],
  );

  // Register pane handle for external access
  useEffect(() => {
    const handle: TerminalPaneHandle = {
      clear: () => terminalRef.current?.clear(),
      reconnect,
      fit: () => terminalRef.current?.fit(),
    };
    paneRegistry.set(paneId, handle);
    return () => {
      paneRegistry.delete(paneId);
    };
  }, [paneId, reconnect]);

  return (
    <div
      className={cn('relative h-full w-full', isSplit && isActive && 'ring-1 ring-blue-500/30')}
      onClick={() => onFocus(paneId)}
    >
      <Terminal
        ref={terminalRef}
        className="h-full"
        fontSize={fontSize}
        fontFamily={fontFamily}
        theme={theme}
        onTermReady={handleTermReady}
        onResize={handleResize}
      />
    </div>
  );
});
