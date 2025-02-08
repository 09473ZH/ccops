import { get, post, del } from '../apiClient';
import { TaskApi } from '../constants';

/** 任务类型：playbook - 软件部署任务, ad-hoc - 快捷命令任务 */
export type TaskType = 'playbook' | 'ad-hoc';

/** 任务状态类型 */
export type TaskStatus = 'running' | 'done' | 'failed';

/** 基础任务请求接口 */
export interface BaseTaskReq {
  /** 目标主机ID列表 */
  hostIdList: number[];
  /** 任务名称 */
  taskName?: string;
  /** 任务类型 */
  type: TaskType;
}

/** 角色变量项 */
export interface RoleVar {
  /** 变量名 */
  key: string;
  /** 变量值 */
  value: string;
}

/** 角色变量配置 */
export interface RoleVarsConfig {
  /** 角色ID */
  roleId: number;
  /** 变量列表 */
  content: RoleVar[];
}

export interface RoleVarContent {
  roleId: number;
  content: {
    key: string;
    value: string;
  }[];
  roleName: string;
  roleRevisionId: number;
}

/** Playbook类型任务请求（用于软件部署） */
export interface PlaybookTaskReq extends BaseTaskReq {
  type: 'playbook';
  /** 要部署的软件角色ID列表 */
  roleIdList: number[];
  /** 角色变量配置列表 */
  vars?: RoleVarsConfig[];
}

/** Ad-hoc类型任务请求（用于执行快捷命令） */
export interface AdHocTaskReq extends BaseTaskReq {
  type: 'ad-hoc';
  /** 快捷命令内容 */
  command?: string;
  /** 脚本内容 */
  shortcutScriptContent?: string;
}

/** 统一的任务请求类型 */
export type TaskReq = PlaybookTaskReq | AdHocTaskReq;

/** 主机信息接口 */
export interface HostInfoForTask {
  hostId: number;
  hostname: string;
  hostIp: string;
}

/** 角色详情 */
export interface RoleDetails {
  roleIdList: number[];
  roleVarContent: RoleVarContent[];
}

/** 任务信息接口 */
export interface TaskInfo {
  /** 任务ID */
  id: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 任务名称 */
  taskName: string;
  /** 创建者ID */
  userId: number;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务类型 */
  type: TaskType;
  /** 任务结果 */
  result: string;
  /** 脚本内容 */
  shortcutScriptContent: string;
  /** 角色详情 */
  roleDetails: RoleDetails;
  /** 主机列表 */
  hosts: HostInfoForTask[];
}

/** 任务列表响应接口 */
export interface TaskListResponse {
  /** 总数 */
  count: number;
  /** 任务列表 */
  list: TaskInfo[];
}

/** WebSocket任务输出接口 */
export interface TaskOutput {
  /** 事件类型 */
  event?: string;
  /** 输出信息 */
  message: string;
  /** 任务ID */
  taskId?: number;
}

/**
 * 任务管理
 */
const taskService = {
  /** 获取任务列表 */
  getTaskList(limit: number, page: number) {
    return get<TaskListResponse>(`${TaskApi.List}?limit=${limit}&page=${page}`);
  },

  /** 创建任务 */
  createTask(task: TaskReq) {
    return post<number>(TaskApi.Create, task);
  },

  /** 删除任务 */
  deleteTask(taskId: number) {
    return del(TaskApi.Delete.replace(':id', taskId.toString()));
  },

  /** 获取任务详情 */
  getTaskDetail(taskId: number) {
    return get<TaskInfo>(TaskApi.ById.replace(':id', taskId.toString()));
  },

  /** 创建Playbook类型任务（软件部署） */
  createPlaybookTask(task: Omit<PlaybookTaskReq, 'type'>) {
    return post<number>(TaskApi.Create, { ...task, type: 'playbook' });
  },

  /** 创建Ad-hoc类型任务（快捷命令） */
  createAdHocTask(task: Omit<AdHocTaskReq, 'type'>) {
    return post<number>(TaskApi.Create, { ...task, type: 'ad-hoc' });
  },

  /** 获取任务WebSocket输出 */
  getTaskWebSocketUrl(taskId: number) {
    const wsUrl = import.meta.env.VITE_APP_WS_API;
    return `${wsUrl}${TaskApi.Message.replace(':id', taskId.toString())}`;
  },
};

export default taskService;
