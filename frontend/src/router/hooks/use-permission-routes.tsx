import { useMemo } from 'react';

import { useUserInfo } from '@/hooks/use-user';

import { getRoutesFromModules } from '../utils';

/**
 * Return permission-filtered routes based on user role
 */
export function usePermissionRoutes() {
  const { userInfo } = useUserInfo();
  return useMemo(() => {
    const routes = getRoutesFromModules();

    if (!userInfo || userInfo.role !== 'admin') {
      return routes.filter((route) => route.path !== '/admin_settings');
    }
    return routes;
  }, [userInfo]);
}
