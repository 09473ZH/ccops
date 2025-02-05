import { get, del, put, post } from '@/api/apiClient';
import { FileApi } from '@/api/constants';

export interface FileInfo {
  id: number;
  createdAt: string;
  fileName: string;
  fileMd5: string;
  description: string;
  fileData: string;
  isBinaryFile: number;
  totalDiskSpace: number;
}

export interface FileListResponse {
  count: number;
  list: FileInfo[];
}

/**
 * 文件管理
 */
const fileService = {
  /** 获取文件列表 */
  getFileList() {
    return get<FileListResponse>(FileApi.List);
  },

  /** 删除文件 */
  deleteFiles(idList: number[]) {
    return del<void>(FileApi.Delete, { idList });
  },

  /** 上传文件 */
  uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return post<void>(FileApi.Upload, formData);
  },

  /** 下载文件 */
  async downloadFile(fileId: number, fileName: string) {
    const response = await get<Blob>(FileApi.Download.replace(':id', fileId.toString()), {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(response);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /** 更新文件内容 */
  updateFileContent(fileId: number, content: string) {
    return put<void>(FileApi.Update, { fileId, content });
  },

  /** 预览文件 */
  previewFile(fileId: number) {
    return get(`${FileApi.Preview}?fileId=${fileId}`);
  },
};

export default fileService;
