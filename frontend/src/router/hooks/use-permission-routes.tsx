import { useMemo } from 'react';

import { getRoutesFromModules } from '../utils';

/**
 * return static routes
 */
export function usePermissionRoutes() {
  return useMemo(() => {
    return getRoutesFromModules();
  }, []);
}
