import type { HostInfo } from '@/api/services/hostService';

/**
 * 主机列表表格配置
 */
export const HOST_TABLE_CONFIG = {
  /** 搜索字段 */
  SEARCH_FIELDS: ['name', 'operatingSystem'] as (keyof HostInfo)[],
  /** 固定显示的列 */
  FIXED_COLUMNS: ['name', 'action'],

  /** 默认显示的列 */
  DEFAULT_VISIBLE_COLUMNS: [
    'name',
    'hostServerUrl',
    'label',
    'physicalMemory',
    'disk',
    'status',
    'operatingSystem',
    'action',
  ],
  /** 所有可选的列 */
  ALL_COLUMNS: [
    'name',
    'hostServerUrl',
    'label',
    'physicalMemory',
    'disk',
    'status',
    'operatingSystem',
    'cpuBrand',
    'kernelVersion',
    'fetchTime',
    'createdAt',
    'action',
  ],
};
