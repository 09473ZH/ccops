import { App as AntdApp } from 'antd';
import { Suspense, useEffect } from 'react';

import { CircleLoading } from '@/components/Loading';
import Router from '@/router/index';
import AntdConfig from '@/theme/antd';

import { MotionLazy } from './components/animate/MotionLazy';
import Toast from './components/Toast';
import { useSettings } from './store/setting';

function App() {
  const { themeMode } = useSettings();
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <AntdConfig>
      <MotionLazy>
        <AntdApp>
          <Suspense fallback={<CircleLoading />}>
            <Toast />
            <Router />
          </Suspense>
        </AntdApp>
      </MotionLazy>
    </AntdConfig>
  );
}

export default App;
