import { App as AntdApp } from 'antd';
import { Suspense, useEffect } from 'react';

import { CircleLoading } from '@/components/Loading';
import Router from '@/router/index';
import AntdConfig from '@/theme/antd';

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
      <AntdApp>
        <Suspense fallback={<CircleLoading />}>
          <Router />
        </Suspense>
      </AntdApp>
    </AntdConfig>
  );
}

export default App;
