import { get, post } from '../client';
import { AuthApi, UserApi } from '../constants';

import { UserInfo, UserToken } from '#/entity';

export interface SignInReq {
  username: string;
  password: string;
}

export interface SignUpReq extends SignInReq {
  email: string;
}
export type SignInRes = UserToken & { userInfo: UserInfo };

const userService = {
  /** 登录 */
  signin: (data: SignInReq) => post<SignInRes>(AuthApi.Login, data),

  /** 获取当前用户信息 */
  getCurrentUser: () => get<UserInfo>(UserApi.GetMe),

  /** 获取用户权限 */
  getPermissions: (id: string) => get<string[]>(UserApi.GetPermissions.replace(':id', id)),

  /** 初始化用户密码 */
  initializePassword: (data: { password: string }) => post(UserApi.Initialize, data),

  /** 重置用户密码 */
  resetPassword: (id: string, data: { password: string }) =>
    post(UserApi.ResetPassword.replace(':id', id), data),

  /** 重置自己的密码 */
  resetMyPassword: (data: { oldPassword: string; newPassword: string }) =>
    post(UserApi.ResetPassword.replace(':id', 'me'), data),
};

export default userService;
