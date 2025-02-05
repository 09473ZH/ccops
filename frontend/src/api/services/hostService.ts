import { get, post, del } from '../apiClient';
import { HostApi, LabelApi } from '../constants';

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
    return get<HostListResponse>(HostApi.List);
  },

  /** 获取主机详情 */
  getHostDetail(hostId: number) {
    return get<HostInfo>(HostApi.ById.replace(':id', hostId.toString()));
  },

  /** 更新主机名称 */
  updateHostName(params: { hostname: string; hostServerUrl: string }) {
    return post<HostInfo>(HostApi.Rename, params);
  },

  /** 删除主机 */
  deleteHosts(hostIds: number[]) {
    return del<void>(HostApi.Delete, { hostIds });
  },

  /** 分配标签 */
  assignLabels(params: { hostId: number; labelIds: number[] }) {
    return post<HostInfo>(LabelApi.AssignToHost, params);
  },

  /** 获取新增主机命令 */
  getCreateHostCommand(osFamily: string) {
    return get<{ command: string }>(`${HostApi.Install}?osFamily=${osFamily}`);
  },

  /** 获取我的主机列表 */
  getMyHosts() {
    return get<HostListResponse>(HostApi.GetMine);
  },

  /** 搜索主机 */
  searchHosts(keyword: string) {
    return get<HostListResponse>(`${HostApi.Search}?keyword=${keyword}`);
  },
};

export default hostService;
