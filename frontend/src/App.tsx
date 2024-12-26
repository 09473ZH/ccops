import { App as AntdApp } from 'antd';
import { Suspense, useEffect } from 'react';

import { CircleLoading } from '@/components/loading';
import Router from '@/router/index';
import AntdConfig from '@/theme/antd';

import { MotionLazy } from './components/animate/motion-lazy';
import { useSettings } from './store/settingStore';

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
      <AntdApp>
        <Suspense fallback={<CircleLoading />}>
          <MotionLazy>
            <Router />
          </MotionLazy>
        </Suspense>
      </AntdApp>
    </AntdConfig>
  );
}

export default App;
