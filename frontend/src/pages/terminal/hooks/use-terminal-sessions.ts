import { useState, useCallback, useRef } from 'react';

import type { HostInfo } from '@/api/services/host';

import type { TerminalTab, SplitDirection } from '../components/types';

import {
  createPane,
  splitPane,
  closePane,
  getAllPaneIds,
  findAdjacentPane,
  updateSizes,
} from './use-split-layout';

export type TerminalSession = TerminalTab;

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string;
}

export function useTerminalSessions(initialId: string | undefined, hosts: HostInfo[] | undefined) {
  const [state, setState] = useState<TerminalState>({ tabs: [], activeTabId: '' });
  // Ref tracks latest state so event handlers never read stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  const getHostTitle = useCallback(
    (hostId: string) => {
      const host = hosts?.find((h: HostInfo) => h.id.toString() === hostId);
      return host ? `${host.name}@${host.hostServerUrl}` : `终端${hostId}`;
    },
    [hosts],
  );

  // Reads from ref — always returns latest state, safe in event handlers
  const getActiveTab = useCallback(() => {
    const { tabs, activeTabId } = stateRef.current;
    return tabs.find((t) => t.id === activeTabId);
  }, []);

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
      setState((prev) => ({
        tabs: [...prev.tabs, newTab],
        activeTabId: tabId,
      }));
      return newTab;
    },
    [getHostTitle],
  );

  const closeSession = useCallback((tabId: string) => {
    setState((prev) => {
      const newTabs = prev.tabs.filter((t) => t.id !== tabId);
      let newActiveTabId = prev.activeTabId;
      if (prev.activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.tabs.findIndex((t) => t.id === tabId);
        const nextTab = newTabs[closedIndex] || newTabs[closedIndex - 1];
        newActiveTabId = nextTab.id;
      }
      return { tabs: newTabs, activeTabId: newActiveTabId };
    });
  }, []);

  // ── Split Operations ──

  const splitActivePane = useCallback((direction: SplitDirection, hostId?: string) => {
    setState((prev) => {
      const newTabs = prev.tabs.map((tab) => {
        if (tab.id !== prev.activeTabId) return tab;
        const targetHostId = hostId || tab.hostId;
        const newTree = splitPane(tab.layoutTree, tab.activePaneId, direction, targetHostId);
        const allPanes = getAllPaneIds(newTree);
        const newPaneId = allPanes[allPanes.length - 1];
        return { ...tab, layoutTree: newTree, activePaneId: newPaneId };
      });
      return { ...prev, tabs: newTabs };
    });
  }, []);

  const closePaneInActiveTab = useCallback(() => {
    setState((prev) => {
      const tab = prev.tabs.find((t) => t.id === prev.activeTabId);
      if (!tab) return prev;

      // Find adjacent pane before closing, so we can focus it after
      const oldPanes = getAllPaneIds(tab.layoutTree);
      const closedIndex = oldPanes.indexOf(tab.activePaneId);

      const newTree = closePane(tab.layoutTree, tab.activePaneId);
      if (newTree === null) {
        // Last pane closed — close the tab
        const newTabs = prev.tabs.filter((t) => t.id !== prev.activeTabId);
        let newActiveTabId = '';
        if (newTabs.length > 0) {
          const tabIndex = prev.tabs.findIndex((t) => t.id === prev.activeTabId);
          const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1];
          newActiveTabId = nextTab.id;
        }
        return { tabs: newTabs, activeTabId: newActiveTabId };
      }

      // Focus the adjacent pane (prefer the one after, fall back to before)
      const remainingPanes = getAllPaneIds(newTree);
      const nextPaneId =
        oldPanes[closedIndex + 1] && remainingPanes.includes(oldPanes[closedIndex + 1])
          ? oldPanes[closedIndex + 1]
          : oldPanes[closedIndex - 1] && remainingPanes.includes(oldPanes[closedIndex - 1])
            ? oldPanes[closedIndex - 1]
            : remainingPanes[0];

      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.id === prev.activeTabId
            ? { ...t, layoutTree: newTree, activePaneId: nextPaneId }
            : t,
        ),
      };
    });
  }, []);

  const setActivePaneId = useCallback((paneId: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) =>
        tab.id === prev.activeTabId ? { ...tab, activePaneId: paneId } : tab,
      ),
    }));
  }, []);

  const navigatePane = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setState((prev) => {
      const tab = prev.tabs.find((t) => t.id === prev.activeTabId);
      if (!tab) return prev;
      const nextPaneId = findAdjacentPane(tab.layoutTree, tab.activePaneId, direction);
      if (!nextPaneId) return prev;
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.id === prev.activeTabId ? { ...t, activePaneId: nextPaneId } : t,
        ),
      };
    });
  }, []);

  const updateLayoutSizes = useCallback((splitId: string, sizes: [number, number]) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) =>
        tab.id === prev.activeTabId
          ? { ...tab, layoutTree: updateSizes(tab.layoutTree, splitId, sizes) }
          : tab,
      ),
    }));
  }, []);

  // ── Title Updates ──

  const updateSessionTitles = useCallback(() => {
    if (!hosts) return;
    setState((prev) => {
      const updated = prev.tabs.map((tab) => {
        const newTitle = getHostTitle(tab.hostId);
        return tab.title !== newTitle ? { ...tab, title: newTitle } : tab;
      });
      if (prev.tabs.every((t, i) => t.title === updated[i].title)) return prev;
      return { ...prev, tabs: updated };
    });
  }, [hosts, getHostTitle]);

  const setActiveTabId = useCallback((tabId: string) => {
    setState((prev) => ({ ...prev, activeTabId: tabId }));
  }, []);

  return {
    sessions: state.tabs,
    activeSessionId: state.activeTabId,
    setActiveSessionId: setActiveTabId,
    createSession,
    closeSession,
    updateSessionTitles,
    splitActivePane,
    closePaneInActiveTab,
    setActivePaneId,
    navigatePane,
    updateLayoutSizes,
    getActiveTab,
  };
}
