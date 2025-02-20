import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import userService, { SignInReq, SignInRes } from '@/api/services/user';

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

// 定义初始状态
const initialState: SignInRes = {
  accessToken: '',
  refreshToken: '',
  expireAt: 0,
};

type UserStore = {
  tokenInfo: SignInRes;
  actions: {
    setTokenInfo: (token: Partial<SignInRes>) => void;
    clearToken: () => void;
  };
};

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      tokenInfo: initialState,
      actions: {
        setTokenInfo: (tokenInfo) =>
          set((state) => ({
            tokenInfo: {
              ...state.tokenInfo,
              ...tokenInfo,
            },
          })),
        clearToken: () => set({ tokenInfo: initialState }),
      },
    }),
    {
      name: 'user-storage', // localStorage 中的 key 名
      storage: createJSONStorage(() => localStorage), // 显式指定使用 localStorage
      partialize: (state) => ({ tokenInfo: state.tokenInfo }), // 只持久化 tokenInfo
    },
  ),
);

export const useRefreshToken = () => {
  const { setTokenInfo, clearToken } = useUserActions();

  return useMutation({
    mutationFn: userService.refreshToken,
    onSuccess: (res) => {
      setTokenInfo({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expireAt: res.expireAt,
      });
      return res;
    },
    onError: () => {
      clearToken();
      return initialState;
    },
  });
};

export const useTokenInfo = () => {
  const tokenInfo = useUserStore((state) => state.tokenInfo);
  return tokenInfo;
};

export const useUserToken = () => useUserStore((state) => state.tokenInfo);

export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
  const navigate = useNavigate();
  const setTokenInfo = useUserStore((state) => state.actions.setTokenInfo);

  const signInMutation = useMutation({
    mutationFn: userService.signin,
    onSuccess: (res) => {
      if (!res.accessToken || !res.refreshToken || !res.expireAt) {
        console.log(
          '登录失败：返回数据不完整',
          res,
          !res.accessToken,
          !res.refreshToken,
          !res.expireAt,
        );
        toast.warning('登录失败：token信息不完整');
        return;
      }

      // 确保只传入需要的字段
      const tokenInfo: Partial<SignInRes> = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expireAt: res.expireAt,
      };

      setTokenInfo(tokenInfo);
      navigate(HOMEPAGE, { replace: true });
    },
    onError: (error) => {
      const errorMessage = error?.message || '登录失败，请稍后重试';
      toast.error(errorMessage);
    },
  });

  return (data: SignInReq) => signInMutation.mutate(data);
};

export const useSignOut = () => {
  const navigate = useNavigate();
  const { clearToken } = useUserActions();

  return () => {
    clearToken();
    navigate('/login', { replace: true });
  };
};

export default useUserStore;
