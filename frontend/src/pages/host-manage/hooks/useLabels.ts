import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { HostInfo } from '@/api/services/hostService';
import labelService from '@/api/services/labelService';
import { useHostList } from '@/hooks/useHostList';
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage';

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
  return {
    createLabel: useMutationWithMessage({
      mutationFn: (name: string) => labelService.createLabel({ name }),
      successMsg: '创建标签成功',
      errMsg: '创建标签失败',
      invalidateKeys: ['labels'],
    }),

    deleteLabel: useMutationWithMessage({
      mutationFn: labelService.deleteLabel,
      successMsg: '删除标签成功',
      errMsg: '删除标签失败',
      invalidateKeys: ['labels'],
    }),

    unbindHostsLabel: useMutationWithMessage({
      mutationFn: labelService.unbindHostsLabel,
      successMsg: '解除标签绑定成功',
      errMsg: '解除标签绑定失败',
      invalidateKeys: ['labels', 'hostList'],
    }),

    assignLabel: useMutationWithMessage({
      mutationFn: labelService.assignLabel,
      successMsg: '分配标签成功',
      errMsg: '分配标签失败',
      invalidateKeys: ['labels', 'hostList'],
    }),
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
