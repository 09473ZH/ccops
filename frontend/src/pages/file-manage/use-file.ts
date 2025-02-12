import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import fileService from '@/api/services/file';

/**
 * 文件管理 CRUD
 */
export function useFile() {
  const queryClient = useQueryClient();

  const operations = {
    deleteFiles: useMutation({
      mutationFn: (idList: number[]) => fileService.deleteFiles(idList),
      onSuccess: () => {
        toast.success('文件删除成功');
        queryClient.invalidateQueries({ queryKey: ['fileList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '文件删除失败');
      },
    }),

    uploadFiles: useMutation({
      mutationFn: fileService.uploadFiles,
      onSuccess: () => {
        toast.success('文件上传成功');
        queryClient.invalidateQueries({ queryKey: ['fileList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '文件上传失败');
      },
    }),

    editFile: useMutation({
      mutationFn: ({ id, content }: { id: number; content: string }) =>
        fileService.updateFileContent(id, content),
      onSuccess: () => {
        toast.success('文件编辑成功');
        queryClient.invalidateQueries({ queryKey: ['fileList'] });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '文件编辑失败');
      },
    }),

    downloadFile: useMutation({
      mutationFn: ({ fileId, fileName }: { fileId: number; fileName: string }) =>
        fileService.downloadFile(fileId, fileName),
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '文件下载失败');
      },
    }),
  };

  return operations;
}

/**
 * 文件预览
 */
export function useFilePreview(
  fileId: number,
  options: { enabled?: boolean; isPreview?: boolean } = {},
) {
  const { enabled = !!fileId, isPreview } = options;
  return useQuery({
    queryKey: ['filePreview', fileId, isPreview ? 'preview' : 'edit'],
    queryFn: () => fileService.previewFile(fileId),
    enabled,
  });
}
