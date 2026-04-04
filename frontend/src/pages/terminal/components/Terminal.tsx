import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Terminal as XTerm, ITheme } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

export interface TerminalRef {
  clear: () => void;
  reset: () => void;
  fit: () => void;
  getTerm: () => XTerm | undefined;
  getFitAddon: () => FitAddon | undefined;
}

interface TerminalProps {
  className?: string;
  fontSize: number;
  fontFamily: string;
  theme: ITheme;
  onTermReady?: (term: XTerm, fitAddon: FitAddon) => void;
  onResize?: (rows: number, cols: number) => void;
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(
  ({ className, fontSize, fontFamily, theme, onTermReady, onResize }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm>();
    const fitAddonRef = useRef<FitAddon>();

    useEffect(() => {
      if (!terminalRef.current) return undefined;

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
        fontSize,
        fontFamily,
        theme,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.open(terminalRef.current);
      fitAddon.fit();

      // Notify parent that terminal is ready
      onTermReady?.(term, fitAddon);

      // Resize handling — debounced to avoid spamming the server
      let resizeTimer: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (fitAddonRef.current && terminalRef.current?.offsetParent !== null) {
            fitAddonRef.current.fit();
            const rows = xtermRef.current?.rows;
            const cols = xtermRef.current?.cols;
            if (rows && cols) {
              onResize?.(rows, cols);
            }
          }
        }, 100);
      };

      const resizeObserver = new ResizeObserver(() => {
        if (terminalRef.current?.offsetParent !== null) {
          handleResize();
        }
      });

      resizeObserver.observe(terminalRef.current);
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(resizeTimer);
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        xtermRef.current?.dispose();
        xtermRef.current = undefined;
      };
      // Only re-create on mount — font/theme updates handled separately
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update font/theme without re-creating terminal
    useEffect(() => {
      const term = xtermRef.current;
      if (!term) return;
      term.options.fontSize = fontSize;
      term.options.fontFamily = fontFamily;
      term.options.theme = theme;
      fitAddonRef.current?.fit();
    }, [fontSize, fontFamily, theme]);

    useImperativeHandle(ref, () => ({
      clear: () => xtermRef.current?.clear(),
      reset: () => xtermRef.current?.reset(),
      fit: () => fitAddonRef.current?.fit(),
      getTerm: () => xtermRef.current,
      getFitAddon: () => fitAddonRef.current,
    }));

    return <div ref={terminalRef} className={`${className} w-full overflow-hidden`} />;
  },
);
