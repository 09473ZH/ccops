import { useState, useCallback } from 'react';

import type { HostInfo } from '@/api/services/host';

import type { TerminalTab, TreeNode, SplitDirection } from '../../components/Terminal/types';

import {
  createPane,
  splitPane,
  closePane,
  getAllPaneIds,
  findAdjacentPane,
  updateSizes,
} from './use-split-layout';

// Re-export for backwards compatibility
export type TerminalSession = TerminalTab;

export function useTerminalSessions(initialId: string | undefined, hosts: HostInfo[] | undefined) {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  const getHostTitle = useCallback(
    (hostId: string) => {
      const host = hosts?.find((h: HostInfo) => h.id.toString() === hostId);
      return host ? `${host.name}@${host.hostServerUrl}` : `终端${hostId}`;
    },
    [hosts],
  );

  const getActiveTab = useCallback(() => {
    return tabs.find((t) => t.id === activeTabId);
  }, [tabs, activeTabId]);

  // ── Tab Operations ──

  const createSession = useCallback(
    (hostId: string) => {
      const pane = createPane(hostId);
      const tabId = `tab-${Date.now()}`;
      const newTab: TerminalTab = {
        id: tabId,
        hostId,
        title: getHostTitle(hostId),
        layoutTree: pane,
        activePaneId: pane.id,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(tabId);
      return newTab;
    },
    [getHostTitle],
  );

  const closeSession = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId && newTabs.length > 0) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const nextTab = newTabs[closedIndex] || newTabs[closedIndex - 1];
          setActiveTabId(nextTab.id);
        }
        return newTabs;
      });
    },
    [activeTabId],
  );

  // ── Split Operations ──

  const splitActivePane = useCallback(
    (direction: SplitDirection, hostId?: string) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;
          const targetHostId = hostId || tab.hostId;
          const newTree = splitPane(tab.layoutTree, tab.activePaneId, direction, targetHostId);
          // Find the newly created pane (last pane in the new tree)
          const allPanes = getAllPaneIds(newTree);
          const newPaneId = allPanes[allPanes.length - 1];
          return { ...tab, layoutTree: newTree, activePaneId: newPaneId };
        }),
      );
    },
    [activeTabId],
  );

  const closePaneInActiveTab = useCallback(() => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === activeTabId);
      if (!tab) return prev;

      const newTree = closePane(tab.layoutTree, tab.activePaneId);
      if (newTree === null) {
        // Last pane closed — close the tab
        const newTabs = prev.filter((t) => t.id !== activeTabId);
        if (newTabs.length > 0) {
          const closedIndex = prev.findIndex((t) => t.id === activeTabId);
          const nextTab = newTabs[closedIndex] || newTabs[closedIndex - 1];
          setActiveTabId(nextTab.id);
        }
        return newTabs;
      }

      // Set focus to first remaining pane
      const remainingPanes = getAllPaneIds(newTree);
      return prev.map((t) =>
        t.id === activeTabId
          ? { ...t, layoutTree: newTree, activePaneId: remainingPanes[0] }
          : t,
      );
    });
  }, [activeTabId]);

  const setActivePaneId = useCallback(
    (paneId: string) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, activePaneId: paneId } : tab)),
      );
    },
    [activeTabId],
  );

  const navigatePane = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const tab = tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const nextPaneId = findAdjacentPane(tab.layoutTree, tab.activePaneId, direction);
      if (nextPaneId) setActivePaneId(nextPaneId);
    },
    [tabs, activeTabId, setActivePaneId],
  );

  const updateLayoutSizes = useCallback(
    (splitId: string, sizes: [number, number]) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, layoutTree: updateSizes(tab.layoutTree, splitId, sizes) }
            : tab,
        ),
      );
    },
    [activeTabId],
  );

  // ── Title Updates ──

  const updateSessionTitles = useCallback(() => {
    if (!hosts) return;
    setTabs((prev) => {
      const updated = prev.map((tab) => {
        const newTitle = getHostTitle(tab.hostId);
        return tab.title !== newTitle ? { ...tab, title: newTitle } : tab;
      });
      return prev.every((t, i) => t.title === updated[i].title) ? prev : updated;
    });
  }, [hosts, getHostTitle]);

  return {
    // Tab-level (backwards compatible names)
    sessions: tabs,
    activeSessionId: activeTabId,
    setActiveSessionId: setActiveTabId,
    createSession,
    closeSession,
    updateSessionTitles,
    // Split operations
    splitActivePane,
    closePaneInActiveTab,
    setActivePaneId,
    navigatePane,
    updateLayoutSizes,
    getActiveTab,
  };
}
