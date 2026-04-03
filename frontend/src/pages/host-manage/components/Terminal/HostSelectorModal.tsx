import { memo } from 'react';

import type { HostInfo } from '@/api/services/host';

interface HostSelectorModalProps {
  filteredHosts: HostInfo[] | undefined;
  activeIndex: number;
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  styles: ReturnType<typeof import('../../terminal/theme').getStyles>['hostSelector'];
  onSearchChange: (query: string) => void;
  onActiveIndexChange: (index: number) => void;
  onSelect: (hostId: string) => void;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent, createSession: (id: string) => void) => void;
  createSession: (id: string) => void;
}

export const HostSelectorModal = memo(function HostSelectorModal({
  filteredHosts,
  activeIndex,
  searchQuery,
  searchInputRef,
  styles,
  onSearchChange,
  onActiveIndexChange,
  onSelect,
  onClose,
  onKeyDown,
  createSession,
}: HostSelectorModalProps) {
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.container}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.input}
          placeholder="输入主机名称或地址搜索..."
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onActiveIndexChange(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            } else {
              onKeyDown(e, createSession);
            }
          }}
        />
        <div className={styles.list}>
          {filteredHosts?.map((host: HostInfo, index: number) => (
            <div
              key={host.id}
              className={styles.item(activeIndex === index)}
              onClick={() => onSelect(host.id.toString())}
              onMouseEnter={() => onActiveIndexChange(index)}
            >
              <div className="min-w-0 flex-1">
                <div className={styles.itemTitle}>{host.name}</div>
                <div style={styles.itemSubtitle(activeIndex === index)}>
                  {host.hostServerUrl}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
