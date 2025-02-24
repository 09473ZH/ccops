import { Layout, Menu, MenuProps } from 'antd';
import Color from 'color';
import { useEffect, useMemo, useState } from 'react';
import { useMatches, useNavigate } from 'react-router-dom';

import Scrollbar from '@/components/Scrollbar';
import { useUserInfo } from '@/hooks/use-user';
import {
  useRouteToMenuFn,
  usePermissionRoutes,
  useFlattenedRoutes,
  usePathname,
} from '@/router/hooks';
import { menuFilter } from '@/router/utils';
import { useSettingActions, useSettings } from '@/store/setting';
import { useThemeToken } from '@/theme/hooks';

import { NAV_WIDTH } from '../config';

import NavLogo from './NavLogo';

import { ThemeLayout, ThemeMode } from '#/enum';

const { Sider } = Layout;

type Props = {
  closeSideBarDrawer?: () => void;
};
export default function NavVertical(props: Props) {
  const navigate = useNavigate();
  const matches = useMatches();
  const pathname = usePathname();

  const { colorBorder, colorBgContainer, colorBgLayout } = useThemeToken();
  const settings = useSettings();
  const { themeLayout, themeMode, darkSidebar } = settings;
  const { setSettings } = useSettingActions();

  const routeToMenuFn = useRouteToMenuFn();
  const permissionRoutes = usePermissionRoutes();
  const flattenedRoutes = useFlattenedRoutes();

  const collapsed = useMemo(() => themeLayout === ThemeLayout.Mini, [themeLayout]);

  const menuList = useMemo(() => {
    const menuRoutes = menuFilter(permissionRoutes);
    return routeToMenuFn(menuRoutes);
  }, [routeToMenuFn, permissionRoutes]);

  const selectedKeys = useMemo(() => [pathname], [pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  // 首次加载时设置 openKeys
  useEffect(() => {
    if (!collapsed) {
      const keys = matches
        .filter((match) => match.pathname !== '/' && match.pathname !== pathname)
        .map((match) => match.pathname);
      setOpenKeys(keys);
    }
  }, [collapsed, matches, pathname]);

  const handleToggleCollapsed = () => {
    setSettings({
      ...settings,
      themeLayout: collapsed ? ThemeLayout.Vertical : ThemeLayout.Mini,
    });
  };

  const onClick: MenuProps['onClick'] = ({ key }) => {
    const nextLink = flattenedRoutes?.find((e) => e.key === key);
    if (nextLink?.hideTab && nextLink?.frameSrc) {
      window.open(nextLink?.frameSrc, '_blank');
      return;
    }

    navigate(key);
    props?.closeSideBarDrawer?.();
  };

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    if (collapsed) return;
    setOpenKeys(keys);
  };

  const sidebarTheme = useMemo(() => {
    if (themeMode === ThemeMode.Dark) {
      return darkSidebar ? 'light' : 'dark';
    }
    return darkSidebar ? 'dark' : 'light';
  }, [themeMode, darkSidebar]);

  const sidebarStyle = useMemo(() => {
    const style: React.CSSProperties = {
      height: '100vh',
      borderRight: `1px dashed ${Color(colorBorder).alpha(0.6).toString()}`,
    };

    if (themeMode === ThemeMode.Dark) {
      style.backgroundColor = darkSidebar ? colorBgContainer : colorBgLayout;
    } else {
      style.backgroundColor = darkSidebar ? '#001529' : colorBgContainer;
    }

    return style;
  }, [colorBorder, colorBgContainer, colorBgLayout, themeMode, darkSidebar]);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={NAV_WIDTH}
      theme={sidebarTheme}
      style={sidebarStyle}
    >
      <NavLogo collapsed={collapsed} onToggle={handleToggleCollapsed} />

      <Scrollbar>
        <Menu
          mode="inline"
          items={menuList}
          theme={sidebarTheme}
          selectedKeys={selectedKeys}
          {...(!collapsed && { openKeys })}
          onOpenChange={handleOpenChange}
          className="!border-none"
          onClick={onClick}
        />
      </Scrollbar>
    </Sider>
  );
}
