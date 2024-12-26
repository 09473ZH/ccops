import { lazy } from 'react';

import { Iconify } from '@/components/icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const TaskManagePage = lazy(() => import('@/pages/task-manage'));

const taskManage: AppRouteObject[] = [
  {
    order: 5,
    path: 'task_manage',
    element: (
      <Wrapper>
        <TaskManagePage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.task_manage',
      icon: <Iconify icon="solar:checklist-minimalistic-outline" size={24} />,
      key: '/task_manage',
    },
  },
];

export default taskManage;
