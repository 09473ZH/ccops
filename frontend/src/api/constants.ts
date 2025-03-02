/** API基础路径 */
export const ApiPath = {
  Auth: '/api/auth',
  Users: '/api/users',
  Labels: '/api/labels',
  Files: '/api/files',
  Hosts: '/api/hosts',
  Clients: '/api/clients',
  Roles: '/api/roles', // 软件管理
  RoleRevisions: '/api/role_revisions', // 软件管理
  Tasks: '/api/tasks',
  Configurations: '/api/configurations', // 系统配置
} as const;

/** 生成标准CRUD路径 */
const createCrudApi = (basePath: string) =>
  ({
    List: basePath,
    Create: basePath,
    Update: `${basePath}/:id`,
    Delete: `${basePath}/:id`,
    ById: `${basePath}/:id`,
  } as const);

/** 认证相关接口 */
export const AuthApi = {
  Login: `${ApiPath.Auth}/login`,
  Refresh: `${ApiPath.Auth}/refresh`, // 刷新令牌
} as const;

/** 用户相关接口 */
export const UserApi = {
  ...createCrudApi(ApiPath.Users),
  GetMe: `${ApiPath.Users}/me`, // 获取当前用户信息
  UpdateStatus: `${ApiPath.Users}/:id/status`, // 禁用/启用用户
  Initialize: `${ApiPath.Users}/me/initialize`, // 初始化用户密码
  ResetPassword: `${ApiPath.Users}/:id/reset_password`, // 重置用户密码
  GetPermissions: `${ApiPath.Users}/:id/permissions`, // 获取用户权限信息
  UpdatePermissions: `${ApiPath.Users}/:id/permissions`, // 分配权限
} as const;

/** 标签相关接口 */
export const LabelApi = {
  ...createCrudApi(ApiPath.Labels),
  AssignToHost: `${ApiPath.Hosts}/assign_labels`, // 分配标签到主机
  UnlabelFromHost: `${ApiPath.Labels}/:id/unbind_all_hosts `, // 解除所有主机标签关联
} as const;

/** 文件相关接口 */
export const FileApi = {
  ...createCrudApi(ApiPath.Files),
  Delete: `${ApiPath.Files}`, // 批量删除
  Upload: `${ApiPath.Files}/upload`,
  Download: `${ApiPath.Files}/:id/download`,
  Preview: `${ApiPath.Files}/preview`,
} as const;

/** 主机相关接口 */
export const HostApi = {
  ...createCrudApi(ApiPath.Hosts),
  Delete: `${ApiPath.Hosts}`, // 批量删除
  Terminal: `${ApiPath.Hosts}/:id/terminal`, // WebSocket连接
  Install: `${ApiPath.Hosts}/install`, // 主机安装
  Refresh: `${ApiPath.Hosts}/refresh`, // 刷新主机信息
  Rename: `${ApiPath.Hosts}/rename`, // 重命名主机
  GetMine: `${ApiPath.Hosts}/me`, // 获取有权限的主机
  Search: `${ApiPath.Hosts}/search`, // 搜索主机
} as const;

/** 客户端相关接口 */
export const ClientApi = {
  UpdateInfo: `${ApiPath.Clients}/receive`, // 主动更新agent信息
  GetPublicKey: `${ApiPath.Clients}/public_key`, // 获取公钥
} as const;

/** 软件配置相关接口 */
export const SoftwareApi = {
  ...createCrudApi(ApiPath.Roles),
  GetRevisions: `${ApiPath.Roles}/:id/revision`, // 获取配置版本列表
  GetDraftRevision: `${ApiPath.Roles}/:id/draft_revision`, // 获取配置草稿版本信息
  GetActiveRevision: `${ApiPath.Roles}/:id/active_revision`, // 获取配置活动版本信息
} as const;

/** 软件版本相关接口 */
export const SoftwareRevisionApi = {
  ...createCrudApi(ApiPath.RoleRevisions),
  Release: `${ApiPath.RoleRevisions}/:id/release`, // 发布版本
  SetActive: `${ApiPath.RoleRevisions}/:id/active`, // 切换配置活动状态
  AiAssist: `${ApiPath.RoleRevisions}/ai`, // 调用ai辅助
} as const;

/** 任务相关接口 */
export const TaskApi = {
  ...createCrudApi(ApiPath.Tasks),
  Message: `${ApiPath.Tasks}/:id/message`, // WebSocket消息处理
} as const;

/** 系统配置相关接口 */
export const SystemConfigApi = {
  List: ApiPath.Configurations, // 配置列表
  Update: ApiPath.Configurations, // 更新配置
  GetAuthorizedKeys: `${ApiPath.Configurations}/authorized_keys`, // 获取用户密钥信息
} as const;
