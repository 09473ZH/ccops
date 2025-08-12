import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import type { HostInfo } from '@/api/services/host';
import annotationService from '@/api/services/annotation';
import { useHostList } from '@/hooks/use-host-list';

/**
 * 获取注解列表的 hook
 */
export function useAnnotationList() {
  const { data, isLoading } = useQuery({
    queryKey: ['annotations'],
    queryFn: () => annotationService.getAnnotationList(),
  });

  return {
    list: data?.list || [],
    count: data?.count || 0,
    isLoading,
  };
}

/**
 * 注解操作相关的 hook
 */
export function useAnnotationActions() {
  const queryClient = useQueryClient();

  const createAnnotation = useMutation({
    mutationFn: (params: { name: string; value: string }) => 
      annotationService.createAnnotation(params),
    onSuccess: async () => {
      toast.success('创建注解成功');
      // 等待查询失效并重新获取
      await queryClient.invalidateQueries({ queryKey: ['annotations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '创建注解失败');
    },
  });

  const deleteAnnotation = useMutation({
    mutationFn: annotationService.deleteAnnotation,
    onSuccess: async () => {
      toast.success('删除注解成功');
      await queryClient.invalidateQueries({ queryKey: ['annotations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除注解失败');
    },
  });

  const unbindHostsAnnotation = useMutation({
    mutationFn: (params: { annotationId: number }) =>
      annotationService.unbindHostsAnnotation(params),
    onSuccess: async () => {
      toast.success('解除注解绑定成功');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['annotations'] }),
        queryClient.invalidateQueries({ queryKey: ['hostList'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '解除注解绑定失败');
    },
  });

  const assignAnnotation = useMutation({
    mutationFn: annotationService.assignAnnotation,
    onSuccess: async () => {
      toast.success('分配注解成功');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['annotations'] }),
        queryClient.invalidateQueries({ queryKey: ['hostList'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '分配注解失败');
    },
  });

  return {
    createAnnotation,
    deleteAnnotation,
    unbindHostsAnnotation,
    assignAnnotation,
  };
}

/**
 * 注解统计相关的 hook
 */
export function useAnnotationStats() {
  const { list: hostList = [] } = useHostList();
  const { list: annotationList = [] } = useAnnotationList();

  return useMemo(() => {
    const hostsByAnnotation: Record<number, HostInfo[]> = {};
    const hostCounts: Record<number, number> = {};

    // 初始化数据结构
    annotationList.forEach((annotation) => {
      hostsByAnnotation[annotation.id] = [];
      hostCounts[annotation.id] = 0;
    });

    // 统计每个注解关联的主机
    hostList.forEach((host) => {
      host.annotations?.forEach((annotation) => {
        hostsByAnnotation[annotation.id] = [...(hostsByAnnotation[annotation.id] || []), host];
        hostCounts[annotation.id] = (hostCounts[annotation.id] || 0) + 1;
      });
    });

    return {
      hostsByAnnotation,
      hostCounts,
      options: annotationList.map((annotation) => ({
        label: `${annotation.name}=${annotation.value}`,
        value: annotation.id,
        namespace: annotation.namespace,
        key: annotation.key,
      })),
    };
  }, [hostList, annotationList]);
}

/**
 * 注解管理的完整功能 hook
 * 整合注解相关的所有功能
 */
export function useAnnotationManagement() {
  const { list: annotationList } = useAnnotationList();
  const { list: hostList } = useHostList();
  const annotationStats = useAnnotationStats();
  const operations = useAnnotationActions();

  return {
    annotationList,
    hostList,
    ...annotationStats,
    operations,
  };
}