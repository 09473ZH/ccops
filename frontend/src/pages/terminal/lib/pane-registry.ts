export interface TerminalPaneHandle {
  clear: () => void;
  reconnect: () => void;
  fit: () => void;
}

const paneRegistry = new Map<string, TerminalPaneHandle>();

export function registerPane(paneId: string, handle: TerminalPaneHandle) {
  paneRegistry.set(paneId, handle);
}

export function unregisterPane(paneId: string) {
  paneRegistry.delete(paneId);
}

export function getPaneHandle(paneId: string): TerminalPaneHandle | undefined {
  return paneRegistry.get(paneId);
}
