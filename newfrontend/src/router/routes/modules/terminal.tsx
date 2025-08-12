import { lazy, Suspense } from 'react';

import { CircleLoading } from '@/components/Loading';
import TerminalLayout from '@/layouts/TerminalLayout';

import type { AppRouteObject } from '#/router';

const Terminal = lazy(() => import('@/pages/host-manage/terminal'));

const terminalRoutes: AppRouteObject[] = [
  {
    path: 'terminal/:id',
    element: (
      <TerminalLayout>
        <Suspense fallback={<CircleLoading />}>
          <Terminal />
        </Suspense>
      </TerminalLayout>
    ),
    meta: {
      hideMenu: true,
      key: '/terminal/:id',
      label: 'sys.menu.host_terminal',
    },
  },
];

export default terminalRoutes;
