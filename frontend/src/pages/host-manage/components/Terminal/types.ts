import type { ITheme } from 'xterm';

// ── Connection ──

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// ── Split Tree ──

export type SplitDirection = 'horizontal' | 'vertical';

export interface PaneNode {
  type: 'pane';
  id: string;
  hostId: string;
}

export interface SplitNode {
  type: 'split';
  id: string;
  direction: SplitDirection;
  children: [TreeNode, TreeNode];
  sizes?: [number, number];
}

export type TreeNode = PaneNode | SplitNode;

// ── Tab ──

export interface TerminalTab {
  id: string;
  title: string;
  hostId: string;
  layoutTree: TreeNode;
  activePaneId: string;
}

// ── Terminal Props ──

export interface TerminalPaneProps {
  paneId: string;
  hostId: string;
  isActive: boolean;
  isSplit: boolean;
  fontSize: number;
  fontFamily: string;
  theme: ITheme;
  onFocus: (paneId: string) => void;
}
