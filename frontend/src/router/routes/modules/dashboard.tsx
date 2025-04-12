import { lazy } from 'react';

import { Iconify } from '@/components/Icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const DashboardPage = lazy(() => import('@/pages/dashboard'));

const dashboard: AppRouteObject[] = [
  {
    order: 1,
    path: 'dashboard',
    element: (
      <Wrapper>
        <DashboardPage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.dashboard',
      key: '/dashboard',
      icon: <Iconify icon="solar:chart-2-bold-duotone" size={24} />,
    },
  },
];

export default dashboard;
