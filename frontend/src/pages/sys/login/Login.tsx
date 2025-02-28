import { Layout } from 'antd';
import { m } from 'framer-motion';
import { m } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { MotionLazy } from '@/components/animate/MotionLazy';
import { varFade } from '@/components/animate/variants';
import { MotionLazy } from '@/components/animate/MotionLazy';
import { varFade } from '@/components/animate/variants';
import { CircleLoading } from '@/components/Loading';
import LocalePicker from '@/components/LocalePicker';
import { useUserToken } from '@/store/user';
import { useThemeToken } from '@/theme/hooks';

const LoginStateProvider = lazy(() => import('./providers/LoginStateProvider'));
const LoginForm = lazy(() => import('./LoginForm'));

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

function Login() {
  const { t } = useTranslation();
  const token = useUserToken();
  const { colorPrimary, colorBgContainer } = useThemeToken();
  if (token.accessToken) {
    return <Navigate to={HOMEPAGE} replace />;
  }

  return (
    <Layout className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(140deg, 
            ${colorPrimary}30 0%,
            ${colorPrimary}15 30%,
            ${colorBgContainer} 100%
          )`,
        }}
      />

      {/* 左侧标题区域 */}
      <div className="fixed left-0 top-0 hidden h-full w-[50%] items-center justify-center backdrop-blur-sm md:flex">
        <div className="relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[12vw] font-extrabold tracking-wider text-orange-200/80">
            OPS
          </div>
          <div className="relative text-center">
            <div className="mb-4 text-5xl font-bold">
              <span className="text-orange-500">CC</span>
              <span className="ml-2 text-gray-800">OPS</span>
            </div>
            <div className="text-lg font-medium text-gray-600">运维管理平台</div>
          </div>
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="ml-auto min-h-screen w-full backdrop-blur-sm md:w-[50%]">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4">
          <MotionLazy>
            <m.div
              variants={varFade().inRight}
              initial="initial"
              animate="animate"
              className="min-w-[500px] rounded-2xl bg-white p-12 shadow-lg"
            >
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
            </m.div>
          </MotionLazy>
        </div>
      </div>

      {/* 语言选择器 */}
      <div className="fixed right-6 top-6 z-20">
        <LocalePicker />
      </div>

      {/* 页脚版权信息 */}
      <div className="fixed bottom-6 left-0 right-0 z-20 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CC OPS. All rights reserved.
      </div>
    </Layout>
  );
}

export default Login;
