import { get, del, put, post } from '@/api/apiClient';

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

interface DeleteFilesRequest {
  idList: number[];
}

interface UpdateFileRequest {
  fileId: number;
  content: string;
}

const BASE_URL = import.meta.env.VITE_APP_BASE_API;

/**
 * 文件管理服务
 */
const fileService = {
  /** 获取文件列表 */
  getFileList() {
    return get<FileListResponse>('/api/files');
  },

  /** 删除文件 */
  deleteFiles(idList: number[]) {
    return del<void, DeleteFilesRequest>('/api/files', { idList });
  },

  /** 上传文件 */
  uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return post('/api/uploads', formData);
  },

  /** 下载文件 */
  async downloadFile(fileId: number, fileName: string) {
    const response = await fetch(`${BASE_URL}/api/file_download/${fileId}`);
    if (!response.ok) {
      throw new Error('Download failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return Promise.resolve();
  },

  /** 更新文件内容 */
  updateFileContent(fileId: number, content: string) {
    return put<void, UpdateFileRequest>('/api/file', { fileId, content });
  },

  /** 预览文件 */
  previewFile(fileId: number) {
    return get(`/api/file_preview?fileId=${fileId}`);
  },
};

export default fileService;
