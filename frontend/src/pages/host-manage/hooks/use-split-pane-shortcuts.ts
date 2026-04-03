import { useEffect } from 'react';

interface SplitPaneShortcutActions {
  onSplitVertical: () => void;
  onSplitHorizontal: () => void;
  onClosePane: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  onClear: () => void;
  onReconnect: () => void;
}

export function useSplitPaneShortcuts(actions: SplitPaneShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        actions.onSplitVertical();
        return;
      }

      if (e.key === 'D' || (e.key === 'd' && e.shiftKey)) {
        e.preventDefault();
        actions.onSplitHorizontal();
        return;
      }

      if (e.key === 'x' && e.shiftKey) {
        e.preventDefault();
        actions.onClosePane();
        return;
      }

      if (e.key === 'l') {
        e.preventDefault();
        actions.onClear();
        return;
      }

      if (e.key === 'r') {
        e.preventDefault();
        actions.onReconnect();
        return;
      }

      // Arrow key navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        actions.onNavigateUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        actions.onNavigateDown();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        actions.onNavigateLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        actions.onNavigateRight();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions]);
}
