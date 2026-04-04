import { useState, useRef, useEffect } from 'react';

import type { HostInfo } from '@/api/services/host';

export function useHostSearch(hosts: HostInfo[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredHosts = hosts?.filter(
    (host: HostInfo) =>
      host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.hostServerUrl.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (isSearchFocused) {
      searchInputRef.current?.focus();
    }
  }, [isSearchFocused]);

  const handleKeyDown = (e: React.KeyboardEvent, onSelect: (hostId: string) => void) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (filteredHosts?.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + (filteredHosts?.length || 1)) % (filteredHosts?.length || 1),
      );
    } else if (e.key === 'Enter' && filteredHosts?.[activeIndex]) {
      onSelect(filteredHosts[activeIndex].id.toString());
      setSearchQuery('');
      setIsSearchFocused(false);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    activeIndex,
    setActiveIndex,
    searchInputRef,
    filteredHosts,
    handleKeyDown,
  };
}
