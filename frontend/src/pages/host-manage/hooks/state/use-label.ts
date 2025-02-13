import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import type { HostInfo } from '@/api/services/host';
import labelService from '@/api/services/label';
import { useHostList } from '@/hooks/use-host-list';

/**
 * 获取标签列表的 hook
 */
export function useLabelList() {
  const { data, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelService.getLabelList(),
  });

  return {
    list: data?.list || [],
    count: data?.count || 0,
    isLoading,
  };
}

/**
 * 标签操作相关的 hook
 */
export function useLabelActions() {
  const queryClient = useQueryClient();

  const createLabel = useMutation({
    mutationFn: (name: string) => labelService.createLabel({ name }),
    onSuccess: async () => {
      toast.success('创建标签成功');
      // 等待查询失效并重新获取
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '创建标签失败');
    },
  });

  const deleteLabel = useMutation({
    mutationFn: labelService.deleteLabel,
    onSuccess: async () => {
      toast.success('删除标签成功');
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除标签失败');
    },
  });

  const unbindHostsLabel = useMutation({
    mutationFn: (params: { hostId: number; labelIds: number[] }) =>
      labelService.unbindHostsLabel(params),
    onSuccess: async () => {
      toast.success('解除标签绑定成功');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['labels'] }),
        queryClient.invalidateQueries({ queryKey: ['hostList'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '解除标签绑定失败');
    },
  });

  const assignLabel = useMutation({
    mutationFn: labelService.assignLabel,
    onSuccess: async () => {
      toast.success('分配标签成功');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['labels'] }),
        queryClient.invalidateQueries({ queryKey: ['hostList'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '分配标签失败');
    },
  });

  return {
    createLabel,
    deleteLabel,
    unbindHostsLabel,
    assignLabel,
  };
}

/**
 * 标签统计相关的 hook
 */
export function useLabelStats() {
  const { list: hostList = [] } = useHostList();
  const { list: labelList = [] } = useLabelList();

  return useMemo(() => {
    const hostsByLabel: Record<number, HostInfo[]> = {};
    const hostCounts: Record<number, number> = {};

    // 初始化数据结构
    labelList.forEach((label) => {
      hostsByLabel[label.id] = [];
      hostCounts[label.id] = 0;
    });

    // 统计每个标签关联的主机
    hostList.forEach((host) => {
      host.label?.forEach((label) => {
        hostsByLabel[label.id] = [...(hostsByLabel[label.id] || []), host];
        hostCounts[label.id] = (hostCounts[label.id] || 0) + 1;
      });
    });

    return {
      hostsByLabel,
      hostCounts,
      options: labelList.map((label) => ({
        label: label.name,
        value: label.id,
      })),
    };
  }, [hostList, labelList]);
}

/**
 * 标签管理的完整功能 hook
 * 整合标签相关的所有功能
 */
export function useLabelManagement() {
  const { list: labelList } = useLabelList();
  const { list: hostList } = useHostList();
  const labelStats = useLabelStats();
  const operations = useLabelActions();

  return {
    labelList,
    hostList,
    ...labelStats,
    operations,
  };
}
