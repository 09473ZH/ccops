import { lazy } from 'react';

import { Iconify } from '@/components/Icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const UserManagePage = lazy(() => import('@/pages/account-manage'));

const fileManage: AppRouteObject[] = [
  {
    order: 7,
    path: 'account_manage',
    element: (
      <Wrapper>
        <UserManagePage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.account_manage',
      icon: <Iconify className="ant-menu-item-icon" icon="solar:user-bold-duotone" size={24} />,
      key: '/account_manage',
    },
  },
];

export default fileManage;
