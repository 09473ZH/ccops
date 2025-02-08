import React from 'react';
import { Outlet } from 'react-router-dom';

import { useThemeToken } from '@/theme/hooks';

function TerminalLayout({ children }: { children?: React.ReactNode }) {
  const { colorBgElevated } = useThemeToken();

  return (
    <div className="min-h-screen" style={{ background: colorBgElevated }}>
      {children || <Outlet />}
    </div>
  );
}
export default TerminalLayout;
