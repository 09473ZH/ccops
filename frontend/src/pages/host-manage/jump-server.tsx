import { createRef, useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import 'xterm/css/xterm.css';

import type { HostInfo } from '@/api/services/hostService';
import { useHostList } from '@/hooks/useHostList';
import { cn } from '@/utils';
import { getCurrentTheme, setTheme, getStyles } from '@/utils/jump-server-theme';

import { FontSelector } from './components/font-selector';
import { SplitTerminal } from './components/split-terminal';
import { TerminalRef } from './components/x-term';
import { terminalThemes, type ThemeNames } from './config/themes';

interface TerminalSession {
  id: string;
  hostId: string;
  title: string;
  ref: React.RefObject<HTMLDivElement>;
  terminalRef: React.RefObject<TerminalRef>;
}

export default function JumpServer() {
  const { id } = useParams<{ id: string }>();
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentTheme, setCurrentTheme] = useState<ThemeNames>(getCurrentTheme());
  const [fontSize, setFontSize] = useState<number>(14);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const { list: hosts } = useHostList();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const styles = getStyles(currentTheme);
  const { shortcuts } = styles;
  const [fontFamily, setFontFamily] = useState('Consolas');

  useEffect(() => {
    if (isSearchFocused) {
      searchInputRef.current?.focus();
    }
  }, [isSearchFocused]);

  const filteredHosts = hosts?.filter(
    (host: HostInfo) =>
      host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.hostServerUrl.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化第一个终端会话
  useEffect(() => {
    if (id && sessions.length === 0) {
      const [hostId, hostName, hostUrl] = id.split('|');
      const newSession: TerminalSession = {
        id,
        hostId,
        title: `${decodeURIComponent(hostName)}@${decodeURIComponent(hostUrl)}`,
        ref: createRef<HTMLDivElement>(),
        terminalRef: createRef<TerminalRef>(),
      };

      setSessions([newSession]);
      setActiveSessionId(id);
    }
  }, [id, sessions.length]);

  // 添加新终端话
  const addNewSession = (hostId: string) => {
    const host = hosts?.find((h: HostInfo) => h.id.toString() === hostId);
    if (!host) return;

    const sameHostSessions = sessions.filter((s) => s.hostId === hostId);
    const sessionNumber = sameHostSessions.length + 1;
    const sessionId = `${hostId}-${Date.now()}`;

    const newSession: TerminalSession = {
      id: sessionId,
      hostId,
      title:
        sessionNumber === 1
          ? `${host.name}@${host.hostServerUrl}`
          : `${host.name}@${host.hostServerUrl} (${sessionNumber - 1})`,
      ref: createRef<HTMLDivElement>(),
      terminalRef: createRef<TerminalRef>(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(sessionId);
  };

  // 关闭终端会话
  const closeSession = (sessionId: string) => {
    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== sessionId);

      // 如果关闭的是当前活动页签，需要切换到其他页签
      if (activeSessionId === sessionId) {
        // 找到被关闭页签的索引
        const closedIndex = prev.findIndex((s) => s.id === sessionId);
        if (newSessions.length > 0) {
          // 优先选择右边的页签，如果没有则选择左边的
          const nextSession = newSessions[closedIndex] || newSessions[closedIndex - 1];
          setActiveSessionId(nextSession.id);
        } else {
          // 如果没有剩余页签，清空 activeSessionId
          setActiveSessionId('');
        }
      }
      return newSessions;
    });
  };

  const handleThemeChange = (theme: ThemeNames) => {
    setCurrentTheme(theme);
    setTheme(theme);
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 20);
    setFontSize(size);
  };

  const handleClear = useCallback(() => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    activeSession?.terminalRef.current?.clear();
  }, [sessions, activeSessionId]);

  const handleReconnect = useCallback(() => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (activeSession?.terminalRef.current) {
      activeSession.terminalRef.current.reconnect();
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 打开主机选择器
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsSearchFocused(true);
      }
      // Ctrl/Cmd + L 清屏
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
      }
      // Ctrl/Cmd + F 搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchFocused(true);
      }
      // Ctrl/Cmd + R 重新连接
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleReconnect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleReconnect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (filteredHosts?.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + (filteredHosts?.length || 1)) % (filteredHosts?.length || 1),
      );
    } else if (e.key === 'Enter' && filteredHosts?.[activeIndex]) {
      addNewSession(filteredHosts[activeIndex].id.toString());
      setSearchQuery('');
      setIsSearchFocused(false);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  const handleReset = useCallback(() => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (activeSession?.terminalRef.current) {
      (activeSession.terminalRef.current as any).reset?.();
    }
  }, [sessions, activeSessionId]);

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
                  handleKeyDown(e);
                }
              }}
            />
            <div className={styles.hostSelector.list}>
              {filteredHosts?.map((host, index) => (
                <div
                  key={host.id}
                  className={styles.hostSelector.item(activeIndex === index)}
                  onClick={() => {
                    addNewSession(host.id.toString());
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
          <button className={cn(styles.header.left.reconnectButton)} onClick={handleReconnect}>
            <span>重新连接</span>
            <span className={styles.header.left.shortcut}>({shortcuts.reconnect})</span>
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
        {sessions.map((session) => (
          <div
            key={session.id}
            className={styles.tabBar.tab(activeSessionId === session.id)}
            onClick={() => setActiveSessionId(session.id)}
          >
            <span className={styles.tabBar.title}>{session.title}</span>
            <button
              className={styles.tabBar.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className={styles.tabBar.addButton} onClick={() => setIsSearchFocused(true)}>
          <span className="text-lg">+</span>
        </button>
      </div>

      {/* 终端区域 */}
      <div className={styles.terminal.container}>
        <div className={styles.terminal.wrapper}>
          {sessions.map((session) => (
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

      {/* 底部工具栏 */}
      <div className={styles.footer.container}>
        <div className={styles.footer.buttonGroup}>
          <button className={styles.footer.button} onClick={() => setIsSearchFocused(true)}>
            <span>选择主机</span>
            <span className={styles.header.left.shortcut}>({shortcuts.search})</span>
          </button>

          <button className={styles.footer.button} onClick={handleClear}>
            <span>清除</span>
            <span className={styles.header.left.shortcut}>({shortcuts.clear})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
