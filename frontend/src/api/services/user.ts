import { get, post } from '../client';
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

const userService = {
  /** 登录 */
  signin: (data: SignInReq) => post<SignInRes>(AuthApi.Login, data),

  /** 刷新 token */
  refreshToken: (data: { refreshToken: string }) => post<SignInRes>(AuthApi.Refresh, data),

  /** 获取当前用户信息 */
  getCurrentUser: () => get<UserInfo>(UserApi.GetMe),

  /** 获取用户权限 */
  getPermissions: (id: string) => get<string[]>(UserApi.GetPermissions.replace(':id', id)),

  /** 初始化用户密码 */
  initializePassword: (data: { password: string }) => post(UserApi.Initialize, data),

  /** 管理员重置用户密码 */
  resetPassword: (id: string, data: { password: string }) =>
    post(UserApi.ResetPassword.replace(':id', id), data),

  /** 重置自己的密码 */
  resetMyPassword: (data: { oldPassword: string; password: string; confirmPassword: string }) =>
    post(UserApi.ResetPassword.replace(':id', 'me'), data),
};

export default userService;
