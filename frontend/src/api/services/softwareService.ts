import { get, post, put, del } from '../apiClient';

import { FileInfo } from './fileService';

export interface RoleItem {
  id: number;
  name: string;
  description: string;
  existActiveRevision: boolean;
  createdAt: string;
  tags?: string[];
}

export interface TaskInfo {
  id: number;
  taskContent: string;
  filesList: number[];
}

export interface RevisionItem {
  id: number;
  taskContent: string;
  changeLog: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isRelease: boolean;
  files: FileInfo[];
}

export interface RevisionListResponse {
  list: RevisionItem[];
  count: number;
}

export interface RoleListResponse {
  list: RoleItem[];
  count: number;
}

/**
 * 软件配置管理服务
 */
const softwareService = {
  /** 创建软件配置 */
  createRole(role: Omit<RoleItem, 'id' | 'createdAt' | 'revision' | 'updatedAt'>) {
    return post<RoleItem, typeof role>('/api/role', role);
  },

  /** 更新软件配置 */
  updateRole(id: number, data: { name?: string; description?: string; tags?: string[] }) {
    return put<RoleItem, typeof data>(`/api/role/${id}`, data);
  },

  /** 删除软件配置 */
  deleteRole(id: number) {
    return del(`/api/role/${id}`);
  },

  /** 获取软件配置列表 */
  getRoleList() {
    return get<RoleListResponse>('/api/role_list');
  },

  /** 更新软件版本 */
  reviseRole(task: TaskInfo) {
    return put<RevisionItem, typeof task>(`/api/role_revision/${task.id}`, task);
  },

  /**
   * 切换版本激活状态
   * 同一配置id的版本,同时最多只能有一个版本处于激活状态,且非锁定状态的版本无法进行激活
   * 该接口对已激活版本使用是关闭,对其他非激活版本用是先关闭激活版本,再激活该版本
   */
  activeRevision(id: number) {
    return post<RevisionItem>(`/api/role_revision/${id}/active`);
  },

  /** 获取版本列表 */
  getRoleRevisions(roleId: number) {
    return get<RevisionListResponse>(`/api/role/${roleId}/revision`);
  },

  /** 锁定版本 */
  releaseRoleRevision(roleId: number, changeLog: string) {
    return post<RevisionItem, { changeLog: string }>(`/api/role_revision/${roleId}/release`, {
      changeLog,
    });
  },

  /** 获取草稿版本 */
  getDraftRoleRevision(roleId: number) {
    return get<RevisionItem>(`/api/role/${roleId}/draft_revision`);
  },

  /** 获取激活版本 */
  getActiveRoleRevision(id: number) {
    return get<RevisionItem>(`/api/role/${id}/active_revision`);
  },

  /** 获取版本详情 */
  getRoleRevision(revisionId: number) {
    return get<RevisionItem>(`/api/role_revision/${revisionId}`);
  },

  /** 删除版本 */
  deleteRoleRevision(revisionId: number) {
    return del(`/api/role_revision/${revisionId}`);
  },

  /** 获取AI配置 */
  getAiConfig(requirement: string) {
    return post<{ task_content: string; description: string }, { requirement: string }>(
      `/api/role_revision/ai`,
      { requirement },
    );
  },
};

export default softwareService;
