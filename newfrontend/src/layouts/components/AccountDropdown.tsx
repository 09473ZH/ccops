import { App, Divider, MenuProps } from 'antd';
import Dropdown, { DropdownProps } from 'antd/es/dropdown/dropdown';
import React, { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/Icon';
import { useUserInfo } from '@/hooks/use-user';
import { useSettings } from '@/store/setting';
import { useSignOut } from '@/store/user';
import { useThemeToken } from '@/theme/hooks';

const LoginStateProvider = lazy(() => import('@/pages/sys/login/providers/LoginStateProvider'));
const AccountManageModal = lazy(() => import('@/components/AccountSettingModal'));
// https://www.dicebear.com/
const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/initials/svg?backgroundType=gradientLinear';

// 把使用 context 的部分抽出来作为子组件
function AccountDropdownContent() {
  const { userInfo } = useUserInfo();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { username, email, role } = userInfo || {};
  const signOut = useSignOut();
  const { t } = useTranslation();
  const logout = () => {
    signOut();
  };
  const { colorBgElevated, borderRadiusLG } = useThemeToken();
  const { themeMode } = useSettings();
  const isDarkMode = themeMode === 'dark';
  const { modal } = App.useApp();
  // 生成基于用户名的头像URL
  const avatarUrl = username
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        username,
      )}&backgroundType=gradientLinear`
    : DEFAULT_AVATAR;

  const contentStyle: React.CSSProperties = {
    backgroundColor: colorBgElevated,
    borderRadius: borderRadiusLG,
    border: '1px solid #e5e7eb ',
    minWidth: '200px',
  };

  const menuStyle: React.CSSProperties = {
    backgroundColor: colorBgElevated,
    borderRadius: borderRadiusLG,
    boxShadow: 'none',
    width: '100%',
  };

  const dropdownRender: DropdownProps['dropdownRender'] = (menu) => (
    <div style={contentStyle}>
      <div className="px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-base font-medium text-gray-900 dark:text-gray-100">
            {username}
          </div>
          <div className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{email}</div>
          <div className="mt-2 inline-flex rounded-full  bg-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {role}
          </div>
        </div>
      </div>
      <Divider style={{ margin: 0 }} />
      {React.cloneElement(menu as React.ReactElement, { style: menuStyle })}
    </div>
  );

  const items: MenuProps['items'] = [
    {
      label: (
        <button type="button" onClick={() => setIsModalOpen(true)}>
          {t('sys.menu.user.account')}
        </button>
      ),
      key: '0',
      onClick: () => setIsModalOpen(true),
    },
    { type: 'divider' },
    {
      label: (
        <button className="font-bold text-orange-500" type="button">
          {t('sys.login.logout')}
        </button>
      ),
      key: '1',
      onClick: () => {
        modal.confirm({
          title: '确定要退出登录吗？',
          content: '退出登录后，您将需要重新登录。',
          onOk: logout,
        });
      },
    },
  ];
  return (
    <>
      <AccountManageModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
      <Dropdown
        menu={{
          items,
          theme: isDarkMode ? 'dark' : 'light',
        }}
        trigger={['click']}
        dropdownRender={dropdownRender}
        placement="bottomRight"
      >
        <IconButton className="h-9 w-9 transform-none px-0 transition-transform duration-200 hover:scale-105">
          <img className="h-7 w-7 rounded-full ring-2" src={avatarUrl} alt={username || 'user'} />
        </IconButton>
      </Dropdown>
    </>
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
