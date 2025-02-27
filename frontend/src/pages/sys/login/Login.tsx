import { Layout } from 'antd';
import { m } from 'framer-motion';
import { t } from 'i18next';
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { MotionLazy } from '@/components/animate/MotionLazy';
import { varFade } from '@/components/animate/variants';
import { CircleLoading } from '@/components/Loading';
import LocalePicker from '@/components/LocalePicker';
import { useUserToken } from '@/store/user';

const LoginStateProvider = lazy(() => import('./providers/LoginStateProvider'));
const LoginForm = lazy(() => import('./LoginForm'));

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

function Login() {
  const token = useUserToken();
  if (token.accessToken) {
    return <Navigate to={HOMEPAGE} replace />;
  }

  return (
    <Layout className="relative min-h-screen w-full overflow-hidden">
      {/* 主背景渐变 */}
      <div className="absolute inset-0 z-0 bg-orange-100" />

      {/* 主要内容区 */}
      <div className="relative z-10 flex min-h-screen w-full items-center">
        {/* 左侧标题区域 */}
        <div className="hidden w-[calc(100%-580px)] items-center justify-center md:flex">
          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[180px] font-bold text-gray-100">
              OPS
            </div>
            <div className="relative text-center">
              <div className="mb-3 text-6xl font-bold text-orange-500">
                CC <span className="text-gray-800">OPS</span>
              </div>
              <div className="text-xl font-medium text-gray-500">运维管理平台</div>
            </div>
          </div>
        </div>

        {/* 右侧登录区域 */}
        <MotionLazy>
          <m.div
            variants={varFade().inRight}
            initial="initial"
            animate="animate"
            className="md:bg-white/40 w-full md:w-[580px] md:backdrop-blur-2xl"
          >
            <div className="flex min-h-screen flex-col items-center justify-center px-8 md:px-32">
              <div className="w-full max-w-[420px]">
                <div className="mb-8">
                  <h2 className="mb-2 text-3xl font-semibold text-gray-800">
                    {t('sys.login.signInPrimaryTitle')}
                  </h2>
                </div>

                <Suspense fallback={<CircleLoading />}>
                  <LoginStateProvider>
                    <LoginForm />
                  </LoginStateProvider>
                </Suspense>
              </div>
            </div>
          </m.div>
        </MotionLazy>
      </div>

      {/* 语言选择器 */}
      <div className="absolute right-4 top-4 z-20">
        <LocalePicker />
      </div>

      {/* 页脚版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 z-20 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} CC OPS. All rights reserved.
      </div>
    </Layout>
  );
}

export default Login;
