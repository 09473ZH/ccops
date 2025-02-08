import { Content } from 'antd/es/layout/layout';
import { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';

import { useSettings } from '@/store/settingStore';
import { useResponsive, useThemeToken } from '@/theme/hooks';

import { NAV_WIDTH, NAV_COLLAPSED_WIDTH, HEADER_HEIGHT } from './config';

import { ThemeLayout } from '#/enum';

function Main() {
  const { themeLayout } = useSettings();
  const { colorBgElevated } = useThemeToken();
  const { screenMap } = useResponsive();

  const mainStyle: CSSProperties = {
    paddingTop: HEADER_HEIGHT,
    background: colorBgElevated,
    transition: 'padding 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    width: '100%',
  };

  if (screenMap.md) {
    mainStyle.width = `calc(100% - ${
      themeLayout === ThemeLayout.Vertical ? NAV_WIDTH : NAV_COLLAPSED_WIDTH
    })`;
  } else {
    mainStyle.width = '100vw';
  }

  return (
    <Content style={mainStyle} className="flex overflow-auto">
      <div className="m-auto h-full w-full flex-grow sm:p-2">
        <Outlet />
      </div>
    </Content>
  );
}

export default Main;
