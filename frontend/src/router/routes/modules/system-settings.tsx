import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Iconify } from '@/components/Icon';
import { CircleLoading } from '@/components/Loading';

import { AppRouteObject } from '#/router';

const CommonSettingPage = lazy(() => import('@/pages/admin-setting/common-setting'));
const UserManagePage = lazy(() => import('@/pages/admin-setting/user-manage'));

const adminSettings: AppRouteObject = {
  order: 6,
  path: 'admin_settings',
  element: (
    <Suspense fallback={<CircleLoading />}>
      <Outlet />
    </Suspense>
  ),
  meta: {
    label: 'sys.menu.admin_settings',
    icon: <Iconify icon="solar:settings-minimalistic-bold-duotone" size={24} />,
    key: '/admin_settings',
    requireAdmin: true,
  },
  children: [
    {
      path: 'common_settings',
      element: <CommonSettingPage />,
      meta: {
        label: 'sys.menu.common_settings',
        key: '/admin_settings/common_settings',
      },
    },
    {
      path: 'user_manage',
      element: <UserManagePage />,
      meta: {
        label: 'sys.menu.user_manage',
        key: '/admin_settings/user_manage',
      },
    },
  ],
};

export default adminSettings;
