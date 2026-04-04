import { memo } from 'react';

import { cn } from '@/utils';

import type { ThemeNames } from '../constants/themes';
import { getShortcutKeys } from '../theme';

import { FontSelector } from './FontSelector';

interface TerminalHeaderProps {
  styles: ReturnType<typeof import('../theme').getStyles>;
  currentTheme: ThemeNames;
  fontSize: number;
  fontFamily: string;
  isActiveTabSplit: boolean;
  onReconnect: () => void;
  onClear: () => void;
  onSplitVertical: () => void;
  onSplitHorizontal: () => void;
  onClosePane: () => void;
  onThemeChange: (theme: ThemeNames) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (font: string) => void;
}

export const TerminalHeader = memo(function TerminalHeader({
  styles,
  currentTheme,
  fontSize,
  fontFamily,
  isActiveTabSplit,
  onReconnect,
  onClear,
  onSplitVertical,
  onSplitHorizontal,
  onClosePane,
  onThemeChange,
  onFontSizeChange,
  onFontFamilyChange,
}: TerminalHeaderProps) {
  const shortcutKeys = getShortcutKeys();
  const modKey = shortcutKeys.clear.startsWith('⌘') ? '⌘' : 'Ctrl';

  return (
    <div className={styles.header.container}>
      <div className={styles.header.left.container}>
        <span className={styles.header.left.text}>SSH</span>
        <button
          className={cn(styles.header.left.button)}
          onClick={onReconnect}
        >
          <span>重新连接</span>
          <span className={styles.header.left.shortcut}>({shortcutKeys.reconnect})</span>
        </button>
        <button className={styles.header.left.button} onClick={onClear}>
          清屏
        </button>
        <button
          className={styles.header.left.button}
          onClick={onSplitVertical}
          title={`${modKey}+D`}
        >
          垂直分屏
        </button>
        <button
          className={styles.header.left.button}
          onClick={onSplitHorizontal}
          title={`${modKey}+Shift+D`}
        >
          水平分屏
        </button>
        {isActiveTabSplit && (
          <button
            className={styles.header.left.button}
            onClick={onClosePane}
            title={`${modKey}+Shift+X`}
          >
            关闭面板
          </button>
        )}
      </div>

      <div className={styles.header.right.container}>
        <FontSelector value={fontFamily} onChange={onFontFamilyChange} className="mr-4" />
        <div className={styles.header.right.themeSelector.container}>
          <select
            className={styles.header.right.themeSelector.select}
            value={currentTheme}
            onChange={(e) => onThemeChange(e.target.value as ThemeNames)}
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
            onClick={() => onFontSizeChange(fontSize - 1)}
          >
            A-
          </button>
          <span className={styles.header.right.fontSizeButton.text}>{fontSize}px</span>
          <button
            className={styles.header.right.fontSizeButton.button}
            onClick={() => onFontSizeChange(fontSize + 1)}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
});
