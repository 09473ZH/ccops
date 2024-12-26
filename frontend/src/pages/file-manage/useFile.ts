import { useQuery } from '@tanstack/react-query';

import fileService from '@/api/services/fileService';
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage';

/**
 * 文件管理 CRUD
 */
export function useFile() {
  const operations = {
    deleteFiles: useMutationWithMessage({
      mutationFn: (idList: number[]) => fileService.deleteFiles(idList),
      invalidateKeys: ['fileList'],
      successMsg: '文件删除成功',
      errMsg: '文件删除失败',
    }),

    uploadFiles: useMutationWithMessage({
      mutationFn: fileService.uploadFiles,
      invalidateKeys: ['fileList'],
      successMsg: '文件上传成功',
      errMsg: '文件上传失败',
    }),

    editFile: useMutationWithMessage({
      mutationFn: ({ id, content }: { id: number; content: string }) =>
        fileService.updateFileContent(id, content),
      invalidateKeys: ['fileList'],
      successMsg: '文件编辑成功',
      errMsg: '文件编辑失败',
    }),

    downloadFile: useMutationWithMessage({
      mutationFn: ({ fileId, fileName }: { fileId: number; fileName: string }) =>
        fileService.downloadFile(fileId, fileName),
      errMsg: '文件下载失败',
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
