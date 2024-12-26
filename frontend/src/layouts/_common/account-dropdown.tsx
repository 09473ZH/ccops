import { Divider, MenuProps } from 'antd';
import Dropdown, { DropdownProps } from 'antd/es/dropdown/dropdown';
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { IconButton } from '@/components/icon';
import { useRouter } from '@/router/hooks';
import { useUserInfo, useUserActions } from '@/store/userStore';
import { useThemeToken } from '@/theme/hooks';

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

// 导入 LoginStateProvider 和类型
const LoginStateProvider = lazy(() => import('@/pages/sys/login/providers/LoginStateProvider'));
const { useLoginStateContext } = await import('@/pages/sys/login/providers/LoginStateProvider');

// 导入默认头像
const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/bottts/svg?seed=Riley';

// 把使用 context 的部分抽出来作为子组件
function AccountDropdownContent() {
  const { replace } = useRouter();
  const { username } = useUserInfo();
  const { clearUserInfoAndToken } = useUserActions();
  const { backToLogin } = useLoginStateContext();
  const { t } = useTranslation();
  const logout = () => {
    try {
      // todo const logoutMutation = useMutation(userService.logout);
      // todo logoutMutation.mutateAsync();
      clearUserInfoAndToken();
      backToLogin();
    } catch (error) {
      console.log(error);
    } finally {
      replace('/login');
    }
  };
  const { colorBgElevated, borderRadiusLG, boxShadowSecondary } = useThemeToken();

  const contentStyle: React.CSSProperties = {
    backgroundColor: colorBgElevated,
    borderRadius: borderRadiusLG,
    boxShadow: boxShadowSecondary,
  };

  const menuStyle: React.CSSProperties = {
    boxShadow: 'none',
  };

  const dropdownRender: DropdownProps['dropdownRender'] = (menu) => (
    <div style={contentStyle}>
      <div className="flex flex-col items-start p-4">
        <div>{username}</div>
      </div>
      <Divider style={{ margin: 0 }} />
      {React.cloneElement(menu as React.ReactElement, { style: menuStyle })}
    </div>
  );

  const items: MenuProps['items'] = [
    {
      label: (
        <NavLink to="https://docs-admin.slashspaces.com/" target="_blank">
          {t('sys.docs')}
        </NavLink>
      ),
      key: '0',
    },
    { label: <NavLink to={HOMEPAGE}>{t('sys.menu.dashboard')}</NavLink>, key: '1' },
    {
      label: <NavLink to="/management/user/profile">{t('sys.menu.user.profile')}</NavLink>,
      key: '2',
    },
    {
      label: <NavLink to="/management/user/account">{t('sys.menu.user.account')}</NavLink>,
      key: '3',
    },
    { type: 'divider' },
    {
      label: <button className="font-bold text-warning">{t('sys.login.logout')}</button>,
      key: '4',
      onClick: logout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} dropdownRender={dropdownRender}>
      <IconButton className="h-10 w-10 transform-none px-0 hover:scale-105">
        <img className="h-8 w-8 rounded-full" src={DEFAULT_AVATAR} alt={username || 'user'} />
      </IconButton>
    </Dropdown>
  );
}

// 主组件包装 Provider
export default function AccountDropdown() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginStateProvider>
        <AccountDropdownContent />
      </LoginStateProvider>
    </Suspense>
  );
}