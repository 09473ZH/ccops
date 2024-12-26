import { get, post } from '../apiClient';

import { UserInfo, UserToken } from '#/entity';

export interface SignInReq {
  username: string;
  password: string;
}

export interface SignUpReq extends SignInReq {
  email: string;
}
export type SignInRes = UserToken & { userInfo: UserInfo };

export enum UserApi {
  SignIn = '/api/login',
  SignUp = '/auth/signup',
  Logout = '/auth/logout',
  Refresh = '/auth/refresh',
  User = '/user',
}

const signin = (data: SignInReq) => post<SignInRes>('/api/login', data);
const signup = (data: SignUpReq) => post<SignInRes>(UserApi.SignUp, data);
const logout = () => get(UserApi.Logout);
const findById = (id: string) => get<UserInfo[]>(`${UserApi.User}/${id}`);

export default {
  signin,
  signup,
  findById,
  logout,
};
