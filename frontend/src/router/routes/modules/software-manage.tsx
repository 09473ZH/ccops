import { lazy } from 'react';

import { Iconify } from '@/components/icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const SoftwareManagePage = lazy(() => import('@/pages/software-manage'));
const PublishConfig = lazy(() => import('@/pages/software-manage/publish-config'));

const softwareManage: AppRouteObject[] = [
  {
    order: 2,
    path: 'software_manage',
    element: (
      <Wrapper>
        <SoftwareManagePage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.software_manage',
      icon: <Iconify icon="solar:card-broken" size={24} />,
      key: '/software_manage',
    },
  },
  {
    path: 'software_manage/publish_config/:id',
    element: (
      <Wrapper>
        <PublishConfig />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.publish_config',
      key: '/software_manage/publish_config/:id',
      hideMenu: true,
    },
  },
];

export default softwareManage;
