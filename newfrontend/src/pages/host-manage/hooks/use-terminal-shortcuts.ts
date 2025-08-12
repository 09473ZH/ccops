import { useEffect } from 'react';

export function useTerminalShortcuts({
  onClear,
  onReconnect,
}: {
  onClear: () => void;
  onReconnect: () => void;
}) {
  useEffect(() => {
    const handleClearShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        onClear();
      }
    };

    const handleReconnectShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        onReconnect();
      }
    };

    window.addEventListener('keydown', handleClearShortcut);
    window.addEventListener('keydown', handleReconnectShortcut);

    return () => {
      window.removeEventListener('keydown', handleClearShortcut);
      window.removeEventListener('keydown', handleReconnectShortcut);
    };
  }, [onClear, onReconnect]);
}
