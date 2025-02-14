import { useQuery } from '@tanstack/react-query';

import hostService, { HostListResponse } from '@/api/services/host';

/**
 * 获取主机列表的 Hook
 */
export function useHostList() {
  const { data, ...rest } = useQuery<HostListResponse>({
    queryKey: ['hostList'],
    queryFn: () => hostService.getHosts(),
  });

  return {
    list: data?.list || [],
    count: data?.count || 0,
    ...rest,
  };
}
