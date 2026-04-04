import { useEffect, useState } from 'react';

import { cn } from '@/utils';
import { preloadFonts } from '@/utils/fonts';

import { getStyles, getCurrentTheme } from '../theme';

interface Props {
  value: string;
  onChange: (font: string) => void;
  className?: string;
}

const fontOptions = [
  {
    label: 'Windows',
    fonts: ['Cascadia Code', 'Consolas', 'Courier New'],
  },
  {
    label: 'macOS',
    fonts: ['Menlo', 'Monaco', 'Courier'],
  },
];

// 检测字体是否在系统中可用
const isFontAvailable = (font: string) => {
  const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return false;

  context.font = '16px monospace';
  const baseWidth = context.measureText(testString).width;
  context.font = `16px "${font}", monospace`;
  const testWidth = context.measureText(testString).width;

  return baseWidth !== testWidth;
};

// 获取系统默认字体
const getDefaultFont = () => {
  const isMac = /mac/i.test(navigator.userAgent);
  const isWindows = /win/i.test(navigator.userAgent);

  if (isMac) {
    if (isFontAvailable('Menlo')) return 'Menlo';
    if (isFontAvailable('Monaco')) return 'Monaco';
    if (isFontAvailable('Courier')) return 'Courier';
  }

  if (isWindows) {
    if (isFontAvailable('Cascadia Code')) return 'Cascadia Code';
    if (isFontAvailable('Consolas')) return 'Consolas';
  }
  return 'Cascadia Code';
};

export function FontSelector({ value, onChange, className }: Props) {
  const [, setFontsLoaded] = useState(false);

  const styles = getStyles(getCurrentTheme());

  useEffect(() => {
    preloadFonts().then(() => {
      setFontsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const defaultFont = getDefaultFont();
    onChange(defaultFont);
  }, [onChange]);

  return (
    <div className={cn(styles.header.right.fontSelector.container, className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.header.right.fontSelector.select}
      >
        {fontOptions.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
