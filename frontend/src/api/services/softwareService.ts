import { get, post, put, del } from '../apiClient';
import { SoftwareApi, SoftwareRevisionApi } from '../constants';

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
    return post<RoleItem>(SoftwareApi.Create, role);
  },

  /** 更新软件配置 */
  updateRole(id: number, data: { name?: string; description?: string; tags?: string[] }) {
    return put<RoleItem>(SoftwareApi.Update.replace(':id', id.toString()), data);
  },

  /** 删除软件配置 */
  deleteRole(id: number) {
    return del(SoftwareApi.Delete.replace(':id', id.toString()));
  },

  /** 获取软件配置列表 */
  getRoleList() {
    return get<RoleListResponse>(SoftwareApi.List);
  },

  /** 更新软件版本 */
  reviseRole(task: TaskInfo) {
    return put<RevisionItem>(SoftwareRevisionApi.Update.replace(':id', task.id.toString()), task);
  },

  /**
   * 切换版本激活状态
   * 同一配置id的版本,同时最多只能有一个版本处于激活状态,且非锁定状态的版本无法进行激活
   * 该接口对已激活版本使用是关闭,对其他非激活版本用是先关闭激活版本,再激活该版本
   */
  activeRevision(id: number) {
    return post<RevisionItem>(SoftwareRevisionApi.SetActive.replace(':id', id.toString()));
  },

  /** 获取版本列表 */
  getRoleRevisions(roleId: number) {
    return get<RevisionListResponse>(SoftwareApi.GetRevisions.replace(':id', roleId.toString()));
  },

  /** 锁定版本 */
  releaseRoleRevision(roleId: number, changeLog: string) {
    return post<RevisionItem>(SoftwareRevisionApi.Release.replace(':id', roleId.toString()), {
      changeLog,
    });
  },

  /** 获取草稿版本 */
  getDraftRoleRevision(roleId: number) {
    return get<RevisionItem>(SoftwareApi.GetDraftRevision.replace(':id', roleId.toString()));
  },

  /** 获取激活版本 */
  getActiveRoleRevision(id: number) {
    return get<RevisionItem>(SoftwareApi.GetActiveRevision.replace(':id', id.toString()));
  },

  /** 获取版本详情 */
  getRoleRevision(revisionId: number) {
    return get<RevisionItem>(SoftwareRevisionApi.ById.replace(':id', revisionId.toString()));
  },

  /** 删除版本 */
  deleteRoleRevision(revisionId: number) {
    return del(SoftwareRevisionApi.Delete.replace(':id', revisionId.toString()));
  },

  /** 获取AI配置 */
  getAiConfig(requirement: string) {
    return post<{ task_content: string; description: string }>(SoftwareRevisionApi.AiAssist, {
      requirement,
    });
  },
};

export default softwareService;
