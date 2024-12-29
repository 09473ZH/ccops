import { get, post, del } from '../apiClient';

import type { LabelInfo } from './labelService';

export interface DiskInfo {
  id: number;
  diskSpaceAvailable: number;
  totalDiskSpace: number;
  percentDiskSpaceAvailable: string;
  encrypted: boolean;
  createdAt: string;
}

export interface HostInfo {
  id: number;
  name: string;
  hostServerUrl: string;
  uuid: string;
  primaryMac: string;
  label: LabelInfo[];
  operatingSystem: string;
  version: string;
  arch: string;
  platform: string;
  kernelVersion: string;
  physicalMemory: string;
  cpuBrand: string;
  cpuType: string;
  cpuPhysicalCores: number;
  cpuLogicalCores: number;
  cpuSockets: number;
  cpuMicrocode: string;
  hardwareModel: string;
  hardwareVersion: string;
  hardwareVendor: string;
  boardModel: string;
  boardVersion: string;
  boardVendor: string;
  boardSerial: string;
  totalUptimeSeconds: string;
  startTime: string;
  fetchTime: string;
  createdAt: string;
  updatedAt: string;
  disk: DiskInfo[];
  hostUser: any[];
  software: any[];
}

export interface HostListResponse {
  count: number;
  list: HostInfo[];
}

/**
 * 主机管理
 */
const hostService = {
  /** 获取主机列表 */
  getHosts() {
    return get<HostListResponse>('/api/host_list');
  },

  /** 获取主机详情 */
  getHostDetail(hostId: number) {
    return get<HostInfo>(`/api/host/${hostId}/`);
  },

  /** 更新主机名称 */
  updateHostName(params: { hostname: string; hostServerUrl: string }) {
    return post<HostInfo, typeof params>(`/api/host_rename`, params);
  },

  /** 删除主机 */
  deleteHosts(hostIds: number[]) {
    return del<void, { hostIds: number[] }>('/api/host', { hostIds });
  },

  /** 分配标签 */
  assignLabels(params: { hostId: number; labelIds: number[] }) {
    return post<HostInfo, typeof params>('/api/host_assign_labels', params);
  },

  /** 获取新增主机命令 */
  getCreateHostCommand(osFamily: string) {
    return get<{ command: string }>(`/api/install?osFamily=${osFamily}`);
  },
};

export default hostService;
