import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import type { ITheme } from 'xterm';

import { getAllPaneIds, findPane } from '../../hooks/features/use-split-layout';

import { TerminalPane } from './TerminalPane';
import type { TreeNode, PaneNode } from './types';

interface SplitPaneRendererProps {
  node: TreeNode;
  activePaneId: string;
  onPaneFocus: (paneId: string) => void;
  onSizesChange: (splitId: string, sizes: [number, number]) => void;
  fontSize: number;
  fontFamily: string;
  theme: ITheme;
}

/**
 * Leaf slot: appends a stable container div into this DOM slot.
 * The container persists across tree restructures — only detached, never destroyed.
 */
function PaneSlot({
  paneId,
  containers,
}: {
  paneId: string;
  containers: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    let container = containers.current.get(paneId);
    if (!container) {
      container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      containers.current.set(paneId, container);
    }

    slot.appendChild(container);

    return () => {
      if (container!.parentNode === slot) {
        slot.removeChild(container!);
      }
    };
  }, [paneId, containers]);

  return <div ref={slotRef} className="h-full w-full" />;
}

const LayoutSkeleton = memo(function LayoutSkeleton({
  node,
  containers,
  onSizesChange,
}: {
  node: TreeNode;
  containers: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onSizesChange: (splitId: string, sizes: [number, number]) => void;
}) {
  if (node.type === 'pane') {
    return <PaneSlot paneId={node.id} containers={containers} />;
  }

  const [left, right] = node.children;

  return (
    <Allotment
      vertical={node.direction === 'vertical'}
      defaultSizes={node.sizes}
      onChange={(sizes) => {
        if (sizes.length === 2) {
          onSizesChange(node.id, sizes as [number, number]);
        }
      }}
    >
      <Allotment.Pane minSize={80}>
        <LayoutSkeleton node={left} containers={containers} onSizesChange={onSizesChange} />
      </Allotment.Pane>
      <Allotment.Pane minSize={80}>
        <LayoutSkeleton node={right} containers={containers} onSizesChange={onSizesChange} />
      </Allotment.Pane>
    </Allotment>
  );
});

export function SplitPaneRenderer({
  node,
  activePaneId,
  onPaneFocus,
  onSizesChange,
  fontSize,
  fontFamily,
  theme,
}: SplitPaneRendererProps) {
  const containers = useRef<Map<string, HTMLDivElement>>(new Map());
  const [, setRevision] = useState(0);

  const paneIds = useMemo(() => getAllPaneIds(node), [node]);
  const isSplit = node.type === 'split';

  const panes = useMemo<PaneNode[]>(
    () => paneIds.map((id) => findPane(node, id)).filter((p): p is PaneNode => p !== null),
    [node, paneIds],
  );

  // Debounce onSizesChange to avoid high-frequency state updates during drag
  const sizesTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedOnSizesChange = useCallback(
    (splitId: string, sizes: [number, number]) => {
      clearTimeout(sizesTimerRef.current);
      sizesTimerRef.current = setTimeout(() => onSizesChange(splitId, sizes), 150);
    },
    [onSizesChange],
  );

  // After skeleton mounts or tree changes, bump revision so portals find containers
  useEffect(() => {
    setRevision((r) => r + 1);
  }, [node]);

  // Clean up containers for removed panes
  useEffect(() => {
    const currentIds = new Set(paneIds);
    for (const id of containers.current.keys()) {
      if (!currentIds.has(id)) {
        containers.current.delete(id);
      }
    }
  }, [paneIds]);

  return (
    <div className="relative h-full w-full">
      <LayoutSkeleton node={node} containers={containers} onSizesChange={debouncedOnSizesChange} />

      {panes.map((pane) => {
        const container = containers.current.get(pane.id);
        if (!container) return null;
        return createPortal(
          <TerminalPane
            key={pane.id}
            paneId={pane.id}
            hostId={pane.hostId}
            isActive={pane.id === activePaneId}
            isSplit={isSplit}
            fontSize={fontSize}
            fontFamily={fontFamily}
            theme={theme}
            onFocus={onPaneFocus}
          />,
          container,
          pane.id,
        );
      })}
    </div>
  );
}
