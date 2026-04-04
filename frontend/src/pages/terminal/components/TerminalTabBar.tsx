import { memo } from 'react';

import type { TerminalTab } from './types';

interface TerminalTabBarProps {
  tabs: TerminalTab[];
  activeTabId: string;
  styles: ReturnType<typeof import('../theme').getStyles>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
}

export const TerminalTabBar = memo(function TerminalTabBar({
  tabs,
  activeTabId,
  styles,
  onTabSelect,
  onTabClose,
  onAddTab,
}: TerminalTabBarProps) {
  return (
    <div className={styles.tabBar.container}>
      {tabs.map((tab: TerminalTab) => (
        <div
          key={tab.id}
          className={styles.tabBar.tab(activeTabId === tab.id)}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className={styles.tabBar.title}>{tab.title}</span>
          {tabs.length > 1 && (
            <button
              className={styles.tabBar.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className={styles.tabBar.addButton} onClick={onAddTab}>
        <span className="text-lg">+</span>
      </button>
    </div>
  );
});
