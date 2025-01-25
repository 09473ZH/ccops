import { get, post, put, del } from '../apiClient';

export interface LabelInfo {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  host: string | null;
}

export interface LabelListResponse {
  count: number;
  list: LabelInfo[];
}

/**
 * 主机管理下的标签管理
 */
const labelService = {
  /** 获取标签列表 */
  getLabelList() {
    return get<LabelListResponse>('/api/host_label_list');
  },

  /** 分配标签 */
  assignLabel(params: { hostId: number; labelIds: number[] }) {
    return post<void>('/api/host_assign_labels', params);
  },

  /** 删除标签 */
  deleteLabel(labelId: number) {
    return del<void>(`/api/host_label/${labelId}/`, { labelId });
  },

  /** 创建标签 */
  createLabel(params: { name: string }) {
    return post<void>('/api/host_label_create', params);
  },

  /** 解绑主机标签 */
  unbindHostsLabel(labelId: number) {
    return put<void>(`/api/host_label_disassociate/${labelId}/`, { labelId });
  },
};

export default labelService;
