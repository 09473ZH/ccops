import { Layout } from 'antd';
import Color from 'color';
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import LoginBgImg from '@/assets/images/background/login-bg.png';
import Overlay2 from '@/assets/images/background/overlay_2.jpg';
import { CircleLoading } from '@/components/Loading';
import LocalePicker from '@/components/LocalePicker';
import { useUserToken } from '@/store/user';
import { useThemeToken } from '@/theme/hooks';

// 修改懒加载导入
const LoginStateProvider = lazy(() => import('./providers/LoginStateProvider'));
const LoginForm = lazy(() => import('./LoginForm'));

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

function Login() {
  const token = useUserToken();
  const { colorBgElevated } = useThemeToken();

  // 判断用户是否有权限
  if (token.accessToken) {
    // 如果有授权，则跳转到首页
    return <Navigate to={HOMEPAGE} replace />;
  }

  const gradientBg = Color(colorBgElevated).alpha(0.9).toString();
  const bg = `linear-gradient(${gradientBg}, ${gradientBg}) center center / cover no-repeat,url(${Overlay2})`;

  return (
    <Layout className="relative flex !min-h-screen !w-full !flex-row">
      <div
        className="hidden grow flex-col items-center justify-center gap-[80px] bg-center  bg-no-repeat md:flex"
        style={{
          background: bg,
        }}
      >
        <div className="text-3xl font-bold leading-normal lg:text-4xl xl:text-5xl">CC OPS</div>
        <img className="max-w-[480px] xl:max-w-[560px]" src={LoginBgImg} alt="" />
      </div>

      <div className="m-auto flex !h-screen w-full max-w-[480px] flex-col justify-center px-[16px] lg:px-[64px]">
        <Suspense fallback={<CircleLoading />}>
          <LoginStateProvider>
            <LoginForm />
          </LoginStateProvider>
        </Suspense>
      </div>

      <div className="absolute right-2 top-0">
        <LocalePicker />
      </div>
    </Layout>
  );
}
export default Login;
