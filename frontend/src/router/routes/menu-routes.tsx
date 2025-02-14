import { Navigate } from 'react-router-dom';

import Layout from '@/layouts';

import AuthGuard from '../components/auth-guard';
import { getRoutesFromModules } from '../utils';

import { AppRouteObject } from '#/router';

const menuModuleRoutes = getRoutesFromModules();

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

/**
 * dynamic routes
 */
export const menuRoutes: AppRouteObject = {
  path: '/',
  element: (
    <AuthGuard>
      <Layout />
    </AuthGuard>
  ),
  children: [{ index: true, element: <Navigate to={HOMEPAGE} replace /> }, ...menuModuleRoutes],
};
