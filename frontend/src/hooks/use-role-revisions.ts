import { useQuery } from '@tanstack/react-query';

import softwareService, { RevisionListResponse, RevisionItem } from '@/api/services/software';
import useMutationWithMessage from '@/hooks/use-mutation-with-message';

export const useGetRoleRevisions = (id: number) => {
  return useQuery<RevisionListResponse, Error, RevisionItem[]>({
    queryKey: ['roleRevisions'],
    queryFn: () => softwareService.getRoleRevisions(id),
    select: (data: RevisionListResponse) => {
      return data.list;
    },
  });
};

export const useActiveRoleRevision = () => {
  return useMutationWithMessage({
    mutationFn: (revisionId: number) => {
      return softwareService.activeRevision(revisionId);
    },
    successMsg: '激活成功',
    errMsg: '激活失败',
    invalidateKeys: ['roleRevisions'],
  });
};

export const useReleaseRoleRevision = () => {
  return useMutationWithMessage({
    mutationFn: ({ id, changeLog }: { id: number; changeLog: string }) => {
      return softwareService.releaseRoleRevision(id, changeLog);
    },
    successMsg: '版本打包成功',
    errMsg: '版本打包失败',
    invalidateKeys: ['roleRevisions'],
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
  return useMutationWithMessage({
    mutationFn: async (revisionId: number) => {
      await softwareService.deleteRoleRevision(revisionId);
    },
    successMsg: '版本删除成功',
    errMsg: '版本删除失败',
    invalidateKeys: ['roleRevisions'],
  });
};
