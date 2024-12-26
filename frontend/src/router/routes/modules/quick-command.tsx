import { lazy } from 'react';

import { Iconify } from '@/components/icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const QuickCommandPage = lazy(() => import('@/pages/quick-command'));

const quickCommand: AppRouteObject[] = [
  {
    order: 4,
    path: 'quick_command',
    element: (
      <Wrapper>
        <QuickCommandPage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.quick_command',
      icon: <Iconify icon="solar:bolt-circle-outline" size={24} />,
      key: '/quick_command',
    },
  },
];

export default quickCommand;
