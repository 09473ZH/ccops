import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import softwareService, { RevisionListResponse, RevisionItem } from '@/api/services/software';

export const useGetRoleRevisions = (id: number) => {
  return useQuery<RevisionListResponse, Error, RevisionItem[]>({
    queryKey: ['roleRevisions'],
    queryFn: () => softwareService.getRoleRevisions(id),
    select: (data: RevisionListResponse) => data.list,
  });
};

export const useActiveRoleRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) => softwareService.activeRevision(revisionId),
    onSuccess: () => {
      message.success('激活成功');
      queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
    },
    onError: () => message.error('激活失败'),
  });
};

export const useReleaseRoleRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changeLog }: { id: number; changeLog: string }) =>
      softwareService.releaseRoleRevision(id, changeLog),
    onSuccess: () => {
      message.success('版本打包成功');
      queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
    },
    onError: () => message.error('版本打包失败'),
  });
};

export const useGetDraftRoleRevision = (id: number) => {
  return useQuery({
    queryKey: ['draftRoleRevision', id],
    queryFn: () => softwareService.getDraftRoleRevision(id),
  });
};

export const useGetActiveRoleRevision = (id: number) => {
  return useQuery({
    queryKey: ['activeRoleRevision', id],
    queryFn: () => softwareService.getActiveRoleRevision(id),
  });
};

export const useGetRoleRevision = (revisionId: number) => {
  return useQuery({
    queryKey: ['roleRevision', revisionId],
    queryFn: () => softwareService.getRoleRevision(revisionId),
  });
};

export const useDeleteRoleRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) => softwareService.deleteRoleRevision(revisionId),
    onSuccess: () => {
      message.success('版本删除成功');
      queryClient.invalidateQueries({ queryKey: ['roleRevisions'] });
    },
    onError: () => message.error('版本删除失败'),
  });
};
