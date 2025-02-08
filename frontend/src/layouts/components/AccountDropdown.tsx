import { Divider, MenuProps } from 'antd';
import Dropdown, { DropdownProps } from 'antd/es/dropdown/dropdown';
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/Icon';
import { useUserInfo, useSignOut } from '@/store/user';
import { useThemeToken } from '@/theme/hooks';

// 导入 LoginStateProvider 和类型
const LoginStateProvider = lazy(() => import('@/pages/sys/login/providers/LoginStateProvider'));
// 导入默认头像
const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/bottts/svg?seed=Riley';

// 把使用 context 的部分抽出来作为子组件
function AccountDropdownContent() {
  const { username } = useUserInfo();
  const signOut = useSignOut();
  const { t } = useTranslation();
  const logout = () => {
    signOut();
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
      label: <button className="text-warning font-bold">{t('sys.login.logout')}</button>,
      key: '0',
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
