/**
 * 通用表格逻辑 Hook (仅支持本地分页)
 *
 * 提供表格常用的状态管理和操作:
 * - 本地分页 (注意: 该 Hook 仅处理本地数据分页，如需远程分页请在业务组件中实现)
 * - 搜索过滤
 * - 列显示控制
 * - 行选择
 *
 * @example
 * ```tsx
 * const {
 *   table,              // 表格状态
 *   setTableState,      // 更新表格状态
 *   filteredData,       // 过滤后的数据
 *   paginatedData,      // 分页后的数据
 *   handleSearch,       // 搜索处理
 *   handlePaginationChange, // 分页处理
 * } = useTable({
 *   data: items,                    // 本地数据
 *   searchFields: ['name', 'desc'], // 搜索字段
 *   defaultVisibleColumns: ['name', 'action'] // 默认显示的列，不传则显示全部列
 * });
 * ```
 */

import { useState, useMemo } from 'react';

import type { Key } from 'react';

interface TableState<T> {
  searchTerms: string;
  currentPage: number;
  pageSize: number;
  visibleColumns: string[];
  selectedRows: Key[];
  data: T[];
}

interface UseTableOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  defaultVisibleColumns?: string[];
  visibleColumns?: string[];
  defaultPageSize?: number;
  onStateChange?: (state: Partial<TableState<T>>) => void;
}

export function useTable<T extends { id: number }>({
  data = [],
  searchFields = ['name' as keyof T],
  defaultVisibleColumns,
  visibleColumns,
  defaultPageSize = 10,
  onStateChange,
}: UseTableOptions<T>) {
  const initialVisibleColumns = useMemo(() => {
    if (visibleColumns) return visibleColumns;
    if (defaultVisibleColumns) return defaultVisibleColumns;
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data, defaultVisibleColumns, visibleColumns]);

  const [state, setState] = useState<Omit<TableState<T>, 'data'>>({
    searchTerms: '',
    currentPage: 1,
    pageSize: defaultPageSize,
    visibleColumns: initialVisibleColumns,
    selectedRows: [],
  });

  const filteredData = useMemo(() => {
    if (!state.searchTerms || !Array.isArray(data)) return data;
    const searchTerm = state.searchTerms.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => String(item[field]).toLowerCase().includes(searchTerm)),
    );
  }, [data, state.searchTerms, searchFields]);

  const paginatedData = useMemo(() => {
    if (!Array.isArray(filteredData)) return [];
    const start = (state.currentPage - 1) * state.pageSize;
    return filteredData.slice(start, start + state.pageSize);
  }, [filteredData, state.currentPage, state.pageSize]);

  const handlePaginationChange = (page: number, pageSize: number) => {
    const newState = { currentPage: page, pageSize };
    setState((prev) => ({ ...prev, ...newState }));
    onStateChange?.(newState);
  };

  return {
    table: { ...state, data },
    setTableState: (newState: Partial<TableState<T>>) => {
      setState((prev) => ({ ...prev, ...newState }));
      onStateChange?.(newState);
    },
    filteredData,
    paginatedData,
    handleSearch: (value: string) => {
      const newState = { searchTerms: value, currentPage: 1 };
      setState((prev) => ({ ...prev, ...newState }));
      onStateChange?.(newState);
    },
    handlePaginationChange,
  };
}

export type { TableState };
