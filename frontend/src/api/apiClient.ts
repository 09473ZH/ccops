/**
 * API 客户端
 *
 * 提供统一的 HTTP 请求封装，包括：
 * - 自动处理请求头（Content-Type, Authorization）
 * - 支持 JSON 和 FormData 请求
 * - 统一的错误处理
 * - 类型安全的请求方法
 */

import { Result } from '#/api';
import { ResultEnum } from '#/enum';

type RequestConfig = RequestInit & {
  data?: unknown;
};

const BASE_URL = import.meta.env.VITE_APP_BASE_API;

/**
 * HTTP GET 请求
 * @example const data = await get<ResponseType>('/api/endpoint');
 */
export async function get<TResponse>(url: string, config?: RequestConfig) {
  return request<TResponse>(url, { ...config, method: 'GET' });
}

/**
 * HTTP POST 请求
 * @example const result = await post<ResponseType, RequestType>('/api/endpoint', data);
 */
export async function post<TResponse, TData = unknown>(
  url: string,
  data?: TData,
  config?: Omit<RequestConfig, 'data'>,
) {
  let requestConfig: RequestInit = {
    ...config,
    method: 'POST',
  };

  // 如果是 FormData，不设置 Content-Type，让浏览器自动处理
  if (data instanceof FormData) {
    requestConfig = {
      ...requestConfig,
      body: data,
    };
  } else {
    // 如果是普通数据，设置 JSON Content-Type
    requestConfig = {
      ...requestConfig,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers as Record<string, string>),
      },
      body: JSON.stringify(data),
    };
  }

  return request<TResponse>(url, requestConfig);
}

/**
 * HTTP PUT 请求
 * @example const updated = await put<ResponseType, RequestType>('/api/endpoint', data);
 */
export async function put<TResponse, TData>(
  url: string,
  data?: TData,
  config?: Omit<RequestConfig, 'data'>,
) {
  return request<TResponse>(url, {
    ...config,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    },
    body: JSON.stringify(data),
  });
}

/**
 * HTTP DELETE 请求
 * @example await delete<void, { id: number }>('/api/endpoint', { id: 1 });
 */
export async function del<TResponse, TData>(
  url: string,
  data?: TData,
  config?: Omit<RequestConfig, 'data'>,
) {
  return request<TResponse>(url, {
    ...config,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    },
    body: JSON.stringify(data),
  });
}

/**
 * 文件下载请求
 * @example await download('/api/files/1/download', 'example.txt');
 */
export async function download(url: string, fileName: string) {
  const response = await fetch(`${BASE_URL}${url}`, {
    method: 'GET',
    headers: {
      Accept: 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

async function request<T>(endpoint: string, options?: RequestConfig): Promise<T> {
  // 处理请求配置
  const config: RequestInit = {
    ...options,
  };

  // 如果没有设置 headers 且不是 FormData，则添加默认的 Content-Type
  if (!options?.headers && !(options?.body instanceof FormData)) {
    config.headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // 1. 检查是否为 EOF（空响应）
  const text = await response.text();
  if (!text) {
    throw new Error('Empty response received');
  }

  // 2. 尝试解析 JSON
  let responseData: Result;
  try {
    responseData = JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }

  // 3. 检查业务状态码，返回数据或抛出错误
  if (responseData.code === ResultEnum.SUCCESS) {
    return responseData.data;
  }

  // 如果data不包含code/msg，返回整个responseData
  if (!('code' in (responseData.data || {}) && !('msg' in (responseData.data || {})))) {
    return responseData as unknown as T;
  }

  throw new Error(responseData.msg);
}

export const apiClient = {
  get,
  post,
  put,
  delete: del,
  download,
};

export default apiClient;
