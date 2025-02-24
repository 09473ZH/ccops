import { get, post, put, del } from '../client';
import { AuthApi, UserApi } from '../constants';

import { UserInfo } from '#/entity';

export interface SignInReq {
  username: string;
  password: string;
}

export interface SignUpReq extends SignInReq {
  email: string;
}
export interface SignInRes {
  accessToken: string;
  refreshToken: string;
  expireAt: number;
}

interface CreateUserParams {
  username: string;
  email: string;
  permissions: {
    hostIds: number[];
    labelIds: number[];
  };
  role: string;
}

interface UpdateUserPermissionsRequest {
  permissions: string[];
}

const userService = {
  /** 登录 */
  signin: (params: SignInReq) => post<SignInRes>(AuthApi.Login, params),

  /** 刷新 token */
  refreshToken: (params: { refreshToken: string }) => post<SignInRes>(AuthApi.Refresh, params),

  /** 获取当前用户信息 */
  getCurrentUser: () => get<UserInfo>(UserApi.GetMe),

  /** 重置自己的密码 */
  resetMyPassword: (params: { oldPassword: string; password: string; confirmPassword: string }) =>
    post(UserApi.ResetPassword.replace(':id', 'me'), params),

  /** 获取用户权限 */
  getPermissions: (id: string) => get<string[]>(UserApi.GetPermissions.replace(':id', id)),

  /** 初始化用户密码 */
  initializePassword: (params: { password: string }) => post(UserApi.Initialize, params),

  /** 管理员重置用户密码 */
  resetPassword: (params: { id: string; password: string }) =>
    post(UserApi.ResetPassword.replace(':id', params.id), { password: params.password }),

  /** 获取用户列表 */
  getUserList: () => get<{ total: number; list: UserInfo[] }>(UserApi.List),

  /** 更新用户状态 */
  updateUserStatus: (params: { id: string; status: boolean }) =>
    put(UserApi.UpdateStatus.replace(':id', params.id), { status: params.status }),

  /** 删除用户 */
  deleteUser: (id: string) => del(UserApi.Delete.replace(':id', id)),

  /** 分配用户权限 */
  assignPermissions: (params: {
    userId: string;
    role: string;
    permissions: { hostIds: number[]; labelIds: number[] };
  }) => post(UserApi.UpdatePermissions.replace(':id', params.userId), params),

  /** 创建用户 */
  createUser: (params: CreateUserParams) => post(UserApi.Create, params),
};

export default userService;
