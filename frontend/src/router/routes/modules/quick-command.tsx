import { lazy } from 'react';

import { Iconify } from '@/components/Icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const QuickCommandPage = lazy(() => import('@/pages/quick-command'));

const quickCommand: AppRouteObject[] = [
  {
    order: 3,
    path: 'quick_command',
    element: (
      <Wrapper>
        <QuickCommandPage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.quick_command',
      icon: (
        <Iconify className="ant-menu-item-icon" icon="solar:bolt-circle-bold-duotone" size={24} />
      ),
      key: '/quick_command',
    },
  },
];

export default quickCommand;
