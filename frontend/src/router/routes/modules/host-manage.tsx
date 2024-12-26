import { lazy, Suspense } from 'react';

import { Iconify } from '@/components/icon';
import { CircleLoading } from '@/components/loading';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const HostManagePage = lazy(() => import('@/pages/host-manage'));
const HostDetail = lazy(() => import('@/pages/host-manage/detail'));

function HostManageWrapper() {
  return (
    <Wrapper>
      <Suspense fallback={<CircleLoading />}>
        <HostManagePage />
      </Suspense>
    </Wrapper>
  );
}

const hostManage: AppRouteObject[] = [
  {
    order: 1,
    path: 'host_manage',
    element: <HostManageWrapper />,
    meta: {
      label: 'sys.menu.host_manage',
      icon: <Iconify icon="solar:rocket-broken" size={24} />,
      key: '/host_manage',
    },
  },
  {
    path: 'host_manage/detail/:id',
    element: (
      <Suspense fallback={<CircleLoading />}>
        <HostDetail />
      </Suspense>
    ),
    meta: {
      label: 'sys.menu.host_detail',
      key: '/host_manage/detail/:id',
      hideMenu: true,
    },
  },
];

export default hostManage;
