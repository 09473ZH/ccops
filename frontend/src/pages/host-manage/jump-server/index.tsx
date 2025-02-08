import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import 'xterm/css/xterm.css';

import type { HostInfo } from '@/api/services/host';
import { useHostList } from '@/hooks/use-host-list';
import { cn } from '@/utils';
import { getCurrentTheme, setTheme, getStyles } from '@/utils/jump-server-theme';

import { FontSelector } from '../components/Terminal/FontSelector';
import { SplitTerminal } from '../components/Terminal/SplitTerminal';
import { terminalThemes, type ThemeNames } from '../config/themes';
import { useHostSearch, useTerminalSessions, type TerminalSession } from '../hooks';

import type { TerminalRef } from '../components/Terminal/Terminal';

export default function JumpServer() {
  const { id } = useParams<{ id: string }>();
  const { list: hosts } = useHostList();
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentTheme, setCurrentTheme] = useState<ThemeNames>(getCurrentTheme());
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState('Consolas');

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    closeSession,
    updateSessionTitles,
    handleActiveSession,
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

  const styles = getStyles(currentTheme);
  const { shortcuts } = styles;

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化第一个终端会话
  useEffect(() => {
    if (id && sessions.length === 0 && hosts) {
      createSession(id);
    }
  }, [id, sessions.length, hosts, createSession]);

  // 当hosts加载完成后，更新已有会话的标题
  useEffect(() => {
    updateSessionTitles();
  }, [hosts, updateSessionTitles]);

  const handleThemeChange = (theme: ThemeNames) => {
    setCurrentTheme(theme);
    setTheme(theme);
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 20);
    setFontSize(size);
  };

  const handleClear = useCallback(() => {
    handleActiveSession((terminal: TerminalRef) => terminal.clear());
  }, [handleActiveSession]);

  const handleReconnect = useCallback(() => {
    handleActiveSession((terminal: TerminalRef) => terminal.reconnect());
  }, [handleActiveSession]);

  const handleReset = useCallback(() => {
    handleActiveSession((terminal: TerminalRef) => (terminal as any).reset?.());
  }, [handleActiveSession]);

  useEffect(() => {
    // 清屏
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
      }
    };
    // 重新连接
    const handleReconnectKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleReconnect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleReconnectKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleReconnectKeyDown);
    };
  }, [handleClear, handleReconnect]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  if (!id) return null;

  return (
    <div className={styles.container}>
      {/* 主机选择器弹窗 */}
      {isSearchFocused && (
        <div className={styles.hostSelector.overlay} onClick={handleOverlayClick}>
          <div className={styles.hostSelector.container}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.hostSelector.input}
              placeholder="输入主机名称或地址搜索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsSearchFocused(false);
                  setSearchQuery('');
                } else {
                  handleKeyDown(e, createSession);
                }
              }}
            />
            <div className={styles.hostSelector.list}>
              {filteredHosts?.map((host: HostInfo, index: number) => (
                <div
                  key={host.id}
                  className={styles.hostSelector.item(activeIndex === index)}
                  onClick={() => {
                    createSession(host.id.toString());
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="min-w-0 flex-1">
                    <div className={styles.hostSelector.itemTitle}>{host.name}</div>
                    <div style={styles.hostSelector.itemSubtitle(activeIndex === index)}>
                      {host.hostServerUrl}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 标题栏 */}
      <div className={styles.header.container}>
        <div className={styles.header.left.container}>
          <span className={styles.header.left.time}>{currentTime}</span>
          <span className={styles.header.left.text}>SSH</span>
          <div className={styles.header.left.sshStatus}>
            <div className={styles.header.left.dot(isConnected)} />
            <span>{isConnected ? '已连接' : '未连接'}</span>
          </div>
          <button className={cn(styles.header.left.button)} onClick={handleReconnect}>
            <span>重新连接</span>
            <span className={styles.header.left.shortcut}>({shortcuts.reconnect})</span>
          </button>
          <button className={cn(styles.header.left.button)} onClick={handleClear}>
            <span>清屏</span>
            <span className={styles.header.left.shortcut}>({shortcuts.clear})</span>
          </button>
        </div>

        <div className={styles.header.right.container}>
          <button onClick={handleReset} className={styles.button.normal} title="重置分屏布局">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16v16H4z" />
            </svg>
            <span>重置分屏</span>
          </button>
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

          {/* 字体大小控制 */}
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

      {/* 标签栏 */}
      <div className={styles.tabBar.container}>
        {sessions.map((session: TerminalSession) => (
          <div
            key={session.id}
            className={styles.tabBar.tab(activeSessionId === session.id)}
            onClick={() => setActiveSessionId(session.id)}
          >
            <span className={styles.tabBar.title}>{session.title}</span>
            {sessions.length > 1 && (
              <button
                disabled={sessions.length === 1}
                className={styles.tabBar.closeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
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

      {/* 终端区域 */}
      <div className={styles.terminal.container}>
        <div className={styles.terminal.wrapper}>
          {sessions.map((session: TerminalSession) => (
            <div
              key={session.id}
              className={styles.terminal.session(activeSessionId === session.id)}
            >
              <SplitTerminal
                ref={session.terminalRef}
                className={styles.terminal.xterm(activeSessionId === session.id)}
                fontSize={fontSize}
                fontFamily={fontFamily}
                theme={terminalThemes[currentTheme]}
                onConnectionChange={setIsConnected}
                hostId={session.hostId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
