import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import userService, { SignInReq } from '@/api/services/user';

import { UserInfo, UserToken } from '#/entity';
import { StorageEnum } from '#/enum';

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

type UserStore = {
  userInfo: Partial<UserInfo>;
  userToken: UserToken;
  // 使用 actions 命名空间来存放所有的 action
  actions: {
    setUserInfo: (userInfo: UserInfo) => void;
    setUserToken: (token: UserToken) => void;
    clearUserInfoAndToken: () => void;
  };
};

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userInfo: {},
      userToken: {},
      actions: {
        setUserInfo: (userInfo) => {
          set({ userInfo });
        },
        setUserToken: (userToken) => {
          set({ userToken });
        },
        clearUserInfoAndToken() {
          set({ userInfo: {}, userToken: {} });
        },
      },
    }),
    {
      name: 'userStore', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        [StorageEnum.UserInfo]: state.userInfo,
        [StorageEnum.UserToken]: state.userToken,
      }),
    },
  ),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserPermission = () => useUserStore((state) => state.userInfo.permissions);
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
  const navigatge = useNavigate();
  const { message } = App.useApp();
  const { setUserToken, setUserInfo } = useUserActions();

  const signInMutation = useMutation({
    mutationFn: userService.signin,
    onSuccess: (res) => {
      if (!res?.accessToken || !res?.refreshToken || !res?.userInfo) {
        message.warning({
          content: '登录失败',
          duration: 3,
        });
        return;
      }

      setUserToken({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      setUserInfo(res.userInfo);
      navigatge(HOMEPAGE, { replace: true });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '登录失败，请稍后重试';
      message.warning({
        content: errorMessage,
        duration: 3,
      });
    },
  });

  return (data: SignInReq) => signInMutation.mutate(data);
};

export const useSignOut = () => {
  const navigate = useNavigate();
  const { clearUserInfoAndToken } = useUserActions();

  return () => {
    clearUserInfoAndToken();
    navigate('/login', { replace: true });
  };
};

export default useUserStore;
