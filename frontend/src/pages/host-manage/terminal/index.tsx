import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import 'xterm/css/xterm.css';

import { useHostList } from '@/hooks/use-host-list';
import { cn } from '@/utils';

import { FontSelector } from '../components/Terminal/FontSelector';
import { HostSelectorModal } from '../components/Terminal/HostSelectorModal';
import { SplitPaneRenderer } from '../components/Terminal/SplitPaneRenderer';
import { getPaneHandle } from '../components/Terminal/TerminalPane';
import type { TerminalTab } from '../components/Terminal/types';
import { terminalThemes, type ThemeNames } from '../constants/themes';
import { useHostSearch, useTerminalSessions } from '../hooks';
import { useSplitPaneShortcuts } from '../hooks/use-split-pane-shortcuts';

import { getCurrentTheme, setTheme, getStyles, getShortcutKeys } from './theme';

export default function Terminal() {
  const { id } = useParams<{ id: string }>();
  const { list: hosts } = useHostList();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
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
  const shortcutKeys = getShortcutKeys();
  const modKey = shortcutKeys.clear.startsWith('⌘') ? '⌘' : 'Ctrl';
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
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className={styles.header.container}>
        <div className={styles.header.left.container}>
          <span className={styles.header.left.time}>{currentTime}</span>
          <span className={styles.header.left.text}>SSH</span>
          <button
            className={cn(styles.header.left.button)}
            onClick={() => getActivePaneHandle()?.reconnect()}
          >
            <span>重新连接</span>
            <span className={styles.header.left.shortcut}>({shortcutKeys.reconnect})</span>
          </button>
          <button
            className={styles.header.left.button}
            onClick={() => getActivePaneHandle()?.clear()}
          >
            清屏
          </button>
          <button
            className={styles.header.left.button}
            onClick={() => splitActivePane('vertical')}
            title={`${modKey}+D`}
          >
            垂直分屏
          </button>
          <button
            className={styles.header.left.button}
            onClick={() => splitActivePane('horizontal')}
            title={`${modKey}+Shift+D`}
          >
            水平分屏
          </button>
          {isActiveTabSplit && (
            <button
              className={styles.header.left.button}
              onClick={closePaneInActiveTab}
              title={`${modKey}+Shift+X`}
            >
              关闭面板
            </button>
          )}
        </div>

        <div className={styles.header.right.container}>
          <FontSelector value={fontFamily} onChange={setFontFamily} className="mr-4" />
          <div className={styles.header.right.themeSelector.container}>
            <select
              className={styles.header.right.themeSelector.select}
              value={currentTheme}
              onChange={(e) => handleThemeChange(e.target.value as ThemeNames)}
            >
              {['Dark', 'Light', 'Retro'].map((theme) => (
                <option key={theme} value={theme}>
                  {theme} Theme
                </option>
              ))}
            </select>
          </div>
          <div className={styles.header.right.fontSizeButton.container}>
            <button
              className={styles.header.right.fontSizeButton.button}
              onClick={() => handleFontSizeChange(fontSize - 1)}
            >
              A-
            </button>
            <span className={styles.header.right.fontSizeButton.text}>{fontSize}px</span>
            <button
              className={styles.header.right.fontSizeButton.button}
              onClick={() => handleFontSizeChange(fontSize + 1)}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar.container}>
        {tabs.map((tab: TerminalTab) => (
          <div
            key={tab.id}
            className={styles.tabBar.tab(activeTabId === tab.id)}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className={styles.tabBar.title}>{tab.title}</span>
            {tabs.length > 1 && (
              <button
                className={styles.tabBar.closeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(tab.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className={styles.tabBar.addButton} onClick={() => setIsSearchFocused(true)}>
          <span className="text-lg">+</span>
        </button>
      </div>

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
