import { lazy } from 'react';

import { Iconify } from '@/components/icon';

import Wrapper from './wrapper';

import { AppRouteObject } from '#/router';

const FileManagePage = lazy(() => import('@/pages/file-manage'));

const fileManage: AppRouteObject[] = [
  {
    order: 3,
    path: 'file_manage',
    element: (
      <Wrapper>
        <FileManagePage />
      </Wrapper>
    ),
    meta: {
      label: 'sys.menu.file_manage',
      icon: <Iconify icon="solar:folder-with-files-broken" size={24} />,
      key: '/file_manage',
    },
  },
];

export default fileManage;
