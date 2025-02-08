import { lazy, Suspense } from 'react';
import { Navigate, RouteObject, RouterProvider, createBrowserRouter } from 'react-router-dom';

import Layout from '@/layouts';
import TerminalLayout from '@/layouts/TerminalLayout';
import { usePermissionRoutes } from '@/router/hooks';
import { ErrorRoutes } from '@/router/routes/error-routes';

import { AppRouteObject } from '#/router';

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

const JumpServer = lazy(() => import('@/pages/host-manage/jump-server/index'));

const LoginRoute: AppRouteObject = {
  path: '/login',
  Component: lazy(() => import('@/pages/sys/login/Login')),
};

const PAGE_NOT_FOUND_ROUTE: AppRouteObject = {
  path: '*',
  element: <Navigate to="/404" replace />,
};

export default function Router() {
  const permissionRoutes = usePermissionRoutes();

  const asyncRoutes: AppRouteObject = {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <Navigate to={HOMEPAGE} replace /> }, ...permissionRoutes],
  };

  const jumpServerRoute: AppRouteObject = {
    path: '/host_manage/jump-server/:id',
    element: (
      <TerminalLayout>
        <Suspense fallback={null}>
          <JumpServer />
        </Suspense>
      </TerminalLayout>
    ),
  };

  const routes = [LoginRoute, jumpServerRoute, asyncRoutes, ErrorRoutes, PAGE_NOT_FOUND_ROUTE];

  const router = createBrowserRouter(routes as unknown as RouteObject[]);

  return <RouterProvider router={router} />;
}
