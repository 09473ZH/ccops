import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import configService from '@/api/services/config';
import hostService, { HostListResponse } from '@/api/services/host';

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

export function useHostActions() {
  const queryClient = useQueryClient();

  const updateHostName = useMutation({
    mutationFn: hostService.updateHostName,
    onSuccess: async () => {
      toast.success('更新主机名称成功');
      await queryClient.invalidateQueries({ queryKey: ['hostList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '更新主机名称失败');
    },
  });

  const deleteHosts = useMutation({
    mutationFn: hostService.deleteHosts,
    onSuccess: async () => {
      toast.success('删除主机成功');
      await queryClient.invalidateQueries({ queryKey: ['hostList'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除主机失败');
    },
  });

  return {
    updateHostName,
    deleteHosts,
  };
}

export function useHostDetail(hostId: number) {
  return useQuery({
    queryKey: ['host', hostId],
    queryFn: () => hostService.getHostDetail(hostId),
  });
}

export function useCreateHostCommand(osFamily: string) {
  return useQuery({
    queryKey: ['createHostCommand', osFamily],
    queryFn: () => hostService.getCreateHostCommand(osFamily),
  });
}

export function useServerUrl() {
  return useQuery({
    queryKey: ['system-config', 'ServerUrl'],
    queryFn: () => configService.getConfigValue('system', 'ServerUrl'),
  });
}
