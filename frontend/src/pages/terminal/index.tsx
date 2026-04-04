import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import 'xterm/css/xterm.css';

import { useHostList } from '@/hooks/use-host-list';

import { HostSelectorModal } from './components/HostSelectorModal';
import { SplitPaneRenderer } from './components/SplitPaneRenderer';
import { TerminalHeader } from './components/TerminalHeader';
import { TerminalTabBar } from './components/TerminalTabBar';
import type { TerminalTab } from './components/types';
import { terminalThemes, type ThemeNames } from './constants/themes';
import { useHostSearch } from './hooks/use-host-search';
import { useSplitPaneShortcuts } from './hooks/use-split-pane-shortcuts';
import { useTerminalSessions } from './hooks/use-terminal-sessions';
import { getPaneHandle } from './lib/pane-registry';
import { getCurrentTheme, setTheme, getStyles } from './theme';

export default function Terminal() {
  const { id } = useParams<{ id: string }>();
  const { list: hosts } = useHostList();
  const [currentTheme, setCurrentTheme] = useState<ThemeNames>(getCurrentTheme());
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState('Consolas');

  const {
    sessions: tabs,
    activeSessionId: activeTabId,
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
  } = useTerminalSessions(id, hosts);

  const {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    activeIndex,
    setActiveIndex,
    searchInputRef,
    filteredHosts,
    handleKeyDown,
  } = useHostSearch(hosts);

  // ── Derived state ──

  const styles = useMemo(() => getStyles(currentTheme), [currentTheme]);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isActiveTabSplit = activeTab?.layoutTree.type === 'split';
  const xtermTheme = useMemo(() => terminalThemes[currentTheme], [currentTheme]);

  // ── Pane actions ──

  const getActivePaneHandle = useCallback(() => {
    const tab = getActiveTab();
    return tab ? getPaneHandle(tab.activePaneId) : undefined;
  }, [getActiveTab]);

  // ── Shortcuts ──

  const shortcutActions = useMemo(
    () => ({
      onSplitVertical: () => splitActivePane('vertical'),
      onSplitHorizontal: () => splitActivePane('horizontal'),
      onClosePane: () => {
        if (isActiveTabSplit) closePaneInActiveTab();
      },
      onNavigateUp: () => navigatePane('up'),
      onNavigateDown: () => navigatePane('down'),
      onNavigateLeft: () => navigatePane('left'),
      onNavigateRight: () => navigatePane('right'),
      onClear: () => getActivePaneHandle()?.clear(),
      onReconnect: () => getActivePaneHandle()?.reconnect(),
    }),
    [splitActivePane, closePaneInActiveTab, navigatePane, getActivePaneHandle, isActiveTabSplit],
  );
  useSplitPaneShortcuts(shortcutActions);

  // ── Effects ──

  useEffect(() => {
    if (id && tabs.length === 0) createSession(id);
  }, [id, tabs.length, createSession]);

  useEffect(() => {
    updateSessionTitles();
  }, [hosts, updateSessionTitles]);

  // ── Handlers ──

  const handleThemeChange = useCallback((theme: ThemeNames) => {
    setCurrentTheme(theme);
    setTheme(theme);
  }, []);

  const handleFontSizeChange = useCallback((newSize: number) => {
    setFontSize(Math.min(Math.max(newSize, 12), 20));
  }, []);

  const handleHostSelect = useCallback(
    (hostId: string) => {
      createSession(hostId);
      setSearchQuery('');
      setIsSearchFocused(false);
    },
    [createSession, setSearchQuery, setIsSearchFocused],
  );

  const handleCloseSearch = useCallback(() => {
    setIsSearchFocused(false);
    setSearchQuery('');
  }, [setIsSearchFocused, setSearchQuery]);

  if (!id) return null;

  return (
    <div className={styles.container}>
      {/* Host selector modal */}
      {isSearchFocused && (
        <HostSelectorModal
          filteredHosts={filteredHosts}
          activeIndex={activeIndex}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          styles={styles.hostSelector}
          onSearchChange={setSearchQuery}
          onActiveIndexChange={setActiveIndex}
          onSelect={handleHostSelect}
          onClose={handleCloseSearch}
          onKeyDown={handleKeyDown}
          createSession={createSession}
        />
      )}

      {/* Header */}
      <TerminalHeader
        styles={styles}
        currentTheme={currentTheme}
        fontSize={fontSize}
        fontFamily={fontFamily}
        isActiveTabSplit={isActiveTabSplit ?? false}
        onReconnect={() => getActivePaneHandle()?.reconnect()}
        onClear={() => getActivePaneHandle()?.clear()}
        onSplitVertical={() => splitActivePane('vertical')}
        onSplitHorizontal={() => splitActivePane('horizontal')}
        onClosePane={closePaneInActiveTab}
        onThemeChange={handleThemeChange}
        onFontSizeChange={handleFontSizeChange}
        onFontFamilyChange={setFontFamily}
      />

      {/* Tab bar */}
      <TerminalTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        styles={styles}
        onTabSelect={setActiveTabId}
        onTabClose={closeSession}
        onAddTab={() => setIsSearchFocused(true)}
      />

      {/* Terminal area */}
      <div className={styles.terminal.container}>
        <div className={styles.terminal.wrapper}>
          {tabs.map((tab: TerminalTab) => (
            <div key={tab.id} className={styles.terminal.session(activeTabId === tab.id)}>
              <SplitPaneRenderer
                node={tab.layoutTree}
                activePaneId={tab.activePaneId}
                onPaneFocus={setActivePaneId}
                onSizesChange={updateLayoutSizes}
                fontSize={fontSize}
                fontFamily={fontFamily}
                theme={xtermTheme}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
