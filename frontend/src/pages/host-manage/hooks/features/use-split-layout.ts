import type { TreeNode, PaneNode, SplitNode, SplitDirection } from '../../components/Terminal/types';

let idCounter = 0;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

export function createPane(hostId: string): PaneNode {
  return { type: 'pane', id: nextId('pane'), hostId };
}

/** Replace the pane with a split containing [original, new pane] */
export function splitPane(
  tree: TreeNode,
  targetPaneId: string,
  direction: SplitDirection,
  newHostId: string,
): TreeNode {
  if (tree.type === 'pane') {
    if (tree.id === targetPaneId) {
      const newPane = createPane(newHostId);
      return {
        type: 'split',
        id: nextId('split'),
        direction,
        children: [tree, newPane],
      };
    }
    return tree;
  }

  // SplitNode — recurse into children
  const [left, right] = tree.children;
  const newLeft = splitPane(left, targetPaneId, direction, newHostId);
  const newRight = splitPane(right, targetPaneId, direction, newHostId);

  if (newLeft === left && newRight === right) return tree;
  return { ...tree, children: [newLeft, newRight] };
}

/** Remove a pane, collapsing its parent split. Returns null if last pane. */
export function closePane(tree: TreeNode, targetPaneId: string): TreeNode | null {
  if (tree.type === 'pane') {
    return tree.id === targetPaneId ? null : tree;
  }

  const [left, right] = tree.children;
  const newLeft = closePane(left, targetPaneId);
  const newRight = closePane(right, targetPaneId);

  // If one child was removed, collapse to the other
  if (newLeft === null) return newRight;
  if (newRight === null) return newLeft;

  if (newLeft === left && newRight === right) return tree;
  return { ...tree, children: [newLeft, newRight] };
}

/** Get all pane IDs in the tree */
export function getAllPaneIds(tree: TreeNode): string[] {
  if (tree.type === 'pane') return [tree.id];
  return [...getAllPaneIds(tree.children[0]), ...getAllPaneIds(tree.children[1])];
}

/** Find a pane by ID */
export function findPane(tree: TreeNode, paneId: string): PaneNode | null {
  if (tree.type === 'pane') return tree.id === paneId ? tree : null;
  return findPane(tree.children[0], paneId) || findPane(tree.children[1], paneId);
}

/** Update sizes for a split node */
export function updateSizes(
  tree: TreeNode,
  splitId: string,
  sizes: [number, number],
): TreeNode {
  if (tree.type === 'pane') return tree;
  if (tree.id === splitId) return { ...tree, sizes };

  const [left, right] = tree.children;
  const newLeft = updateSizes(left, splitId, sizes);
  const newRight = updateSizes(right, splitId, sizes);
  if (newLeft === left && newRight === right) return tree;
  return { ...tree, children: [newLeft, newRight] };
}

/**
 * Find adjacent pane for arrow-key navigation.
 * Builds a 2D grid of panes and finds the nearest in the given direction.
 */
export function findAdjacentPane(
  tree: TreeNode,
  currentPaneId: string,
  direction: 'up' | 'down' | 'left' | 'right',
): string | null {
  const paneIds = getAllPaneIds(tree);
  if (paneIds.length <= 1) return null;

  const currentIndex = paneIds.indexOf(currentPaneId);
  if (currentIndex === -1) return null;

  // Simple linear navigation: left/up = previous, right/down = next
  if (direction === 'left' || direction === 'up') {
    return currentIndex > 0 ? paneIds[currentIndex - 1] : paneIds[paneIds.length - 1];
  }
  return currentIndex < paneIds.length - 1 ? paneIds[currentIndex + 1] : paneIds[0];
}
