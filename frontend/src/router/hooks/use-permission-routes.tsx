import { useMemo } from 'react';

import { useUserInfo } from '@/hooks/use-user';
import useUserStore from '@/store/user';

import { getRoutesFromModules } from '../utils';

import type { AppRouteObject } from '#/router';
/**
 * 路由权限控制
 */
export function usePermissionRoutes() {
  const { tokenInfo } = useUserStore();
  const { userInfo } = useUserInfo();

  return useMemo(() => {
    const routes = getRoutesFromModules();

    // 未登录或无token时返回基础路由
    if (!tokenInfo.accessToken || !userInfo) {
      return routes;
    }

    // 根据角色过滤路由
    const filterRoutesByRole = (route: AppRouteObject): AppRouteObject | null => {
      // 处理需要admin权限的路由
      if (route.meta?.requireAdmin && userInfo.role !== 'admin') {
        return null;
      }

      // 递归处理子路由
      if (route.children) {
        const filteredChildren = route.children
          .map(filterRoutesByRole)
          .filter(Boolean) as AppRouteObject[];

        return {
          ...route,
          children: filteredChildren,
        };
      }

      return route;
    };

    return routes.map(filterRoutesByRole).filter(Boolean) as AppRouteObject[];
  }, [tokenInfo.accessToken, userInfo]);
}
