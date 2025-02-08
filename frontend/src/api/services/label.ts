import { get, post, put, del } from '../client';
import { LabelApi } from '../constants';

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
    return get<LabelListResponse>(LabelApi.List);
  },

  /** 分配标签 */
  assignLabel(params: { hostId: number; labelIds: number[] }) {
    return post<void>(LabelApi.AssignToHost, params);
  },

  /** 删除标签 */
  deleteLabel(labelId: number) {
    return del<void>(LabelApi.ById.replace(':id', labelId.toString()));
  },

  /** 创建标签 */
  createLabel(params: { name: string }) {
    return post<void>(LabelApi.Create, params);
  },

  /** 解绑主机标签 */
  unbindHostsLabel(labelId: number) {
    return put<void>(LabelApi.UnlabelFromHost.replace(':id', labelId.toString()));
  },
};

export default labelService;
