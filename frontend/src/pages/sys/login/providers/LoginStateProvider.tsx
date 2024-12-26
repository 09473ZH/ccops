import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export enum LoginStateEnum {
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

interface LoginState {
  loginState: LoginStateEnum;
  setLoginState: (state: LoginStateEnum) => void;
  backToLogin: () => void;
}

const LoginStateContext = createContext<LoginState | undefined>(undefined);

function LoginStateProvider({ children }: { children: ReactNode }) {
  const [loginState, setLoginState] = useState<LoginStateEnum>(LoginStateEnum.LOGIN);

  // 使用 useMemo 避免重复创建
  const value = useMemo(
    () => ({
      loginState,
      setLoginState,
      backToLogin: () => setLoginState(LoginStateEnum.LOGIN),
    }),
    [loginState],
  );

  return <LoginStateContext.Provider value={value}>{children}</LoginStateContext.Provider>;
}

export default LoginStateProvider;

// 导出 hook
export const useLoginStateContext = () => {
  const context = useContext(LoginStateContext);
  if (!context) {
    throw new Error('useLoginStateContext must be used within LoginStateProvider');
  }
  return context;
};
