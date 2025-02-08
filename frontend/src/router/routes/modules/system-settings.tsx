import { lazy } from 'react';

import { Iconify } from '@/components/Icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const SystemSettingsPage = lazy(() => import('@/pages/system-config'));

const systemSettings: AppRouteObject[] = [
  {
    order: 6,
    path: 'system_settings',
    element: (
      <Wrapper>
        <SystemSettingsPage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.system_settings',
      icon: <Iconify icon="solar:settings-minimalistic-bold-duotone" size={24} />,
      key: '/system_settings',
    },
  },
];

export default systemSettings;
