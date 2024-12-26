import { useQuery } from '@tanstack/react-query';

import fileService, { FileListResponse } from '@/api/services/fileService';

/**
 * 获取文件列表的 Hook
 */
interface UseFileListOptions {
  enabled?: boolean;
}
export function useFileList(options: UseFileListOptions = {}) {
  const { enabled = true } = options;

  const { data, ...rest } = useQuery<FileListResponse>({
    queryKey: ['fileList'],
    queryFn: () => fileService.getFileList(),
    enabled,
  });

  return {
    list: data?.list || [],
    count: data?.count || 0,
    ...rest,
  };
}
