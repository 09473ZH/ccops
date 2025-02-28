import { Layout } from 'antd';
import { m } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const token = useUserToken();
  if (token.accessToken) {
    return <Navigate to={HOMEPAGE} replace />;
  }

  return (
    <Layout className="bg-orange-50 relative min-h-screen w-full overflow-hidden">
      {/* 左侧标题区域 */}
      <div className="from-orange-50 fixed left-0 top-0 hidden h-full w-[55%] items-center justify-center bg-gradient-to-br to-orange-100 md:flex">
        <div className="relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[15vw] font-extrabold tracking-wider text-orange-100">
            OPS
          </div>
          <div className="relative text-center">
            <div className="mb-4 text-6xl font-bold">
              <span className="text-orange-500">CC</span>
              <span className="ml-2 text-gray-800">OPS</span>
            </div>
            <div className="text-xl font-medium text-gray-600">运维管理平台</div>
          </div>
        </div>
      </div>

      {/* 右侧登录区域 */}
      <MotionLazy>
        <m.div
          variants={varFade().inRight}
          initial="initial"
          animate="animate"
          className="bg-white/80 ml-auto min-h-screen w-full backdrop-blur-lg md:w-[45%]"
        >
          <div className="flex min-h-screen flex-col items-center justify-center px-6 md:px-20">
            <div className="w-full max-w-[420px] rounded-xl bg-[#fff] p-8 shadow-lg">
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

      {/* 语言选择器 */}
      <div className="fixed right-4 top-4 z-20">
        <LocalePicker />
      </div>

      {/* 页脚版权信息 */}
      <div className="fixed bottom-4 left-0 right-0 z-20 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} CC OPS. All rights reserved.
      </div>
    </Layout>
  );
}

export default Login;
