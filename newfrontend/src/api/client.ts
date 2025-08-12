import useUserStore from '@/store/user';

import { ResultEnum } from '#/enum';

type RequestConfig = RequestInit & {
  data?: unknown;
  skipAuth?: boolean; // 是否跳过认证
  retryCount?: number; // 重试次数
  responseType?: string;
};

const BASE_URL = import.meta.env.VITE_APP_BASE_API;

// 刷新 token
async function refreshToken(): Promise<void> {
  try {
    const { tokenInfo } = useUserStore.getState();
    if (!tokenInfo.refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokenInfo.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh token invalid');
    }

    const data = await response.json();
    if (data.code === ResultEnum.SUCCESS && data.data?.accessToken) {
      useUserStore.getState().actions.setTokenInfo({
        accessToken: data.data.accessToken,
        expireAt: data.data.expireAt,
      });
    } else {
      throw new Error(data.msg || 'Refresh failed');
    }
  } catch (error) {
    useUserStore.getState().actions.clearToken();
    throw error;
  }
}

function handleAuthError() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
  throw new Error('认证失败');
}

// 白名单配置
const AUTH_WHITELIST = ['/api/auth/login', '/api/auth/refresh'] as const;

// 检查是否在白名单中
function isInWhitelist(endpoint: string): boolean {
  return AUTH_WHITELIST.some((path) => endpoint.startsWith(path));
}

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

// 检查token是否需要刷新
function shouldRefreshToken(): boolean {
  const { tokenInfo } = useUserStore.getState();
  if (!tokenInfo?.expireAt || typeof tokenInfo.expireAt !== 'number') return false;
  return tokenInfo.expireAt * 1000 - Date.now() < TOKEN_REFRESH_BUFFER;
}

// 统一的请求处理
async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { skipAuth, retryCount = 0, data, responseType, ...restConfig } = config;

  const shouldSkipAuth = skipAuth || isInWhitelist(endpoint);

  if (!shouldSkipAuth && shouldRefreshToken() && retryCount < 1) {
    try {
      await refreshToken();
      return await request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
    } catch (error) {
      handleAuthError();
      throw error;
    }
  }

  // 构建基础请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 添加认证头
  if (!shouldSkipAuth) {
    const { tokenInfo } = useUserStore.getState();
    if (tokenInfo.accessToken) {
      Object.assign(headers, {
        Authorization: `Bearer ${tokenInfo.accessToken}`,
        'X-Refresh-Token': tokenInfo.refreshToken || '',
      });
    }
  }

  // 构建请求配置
  const requestConfig: RequestInit = {
    ...restConfig,
    headers,
  };

  // 如果有数据，添加到body
  if (data) {
    requestConfig.body = data instanceof FormData ? data : JSON.stringify(data);
    // FormData不需要Content-Type，让浏览器自动处理
    if (data instanceof FormData) {
      delete (requestConfig.headers as Record<string, string>)['Content-Type'];
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, requestConfig);

    // 处理401错误，尝试刷新token（作为后备方案）
    if (response.status === 401 && !shouldSkipAuth && retryCount < 1) {
      try {
        await refreshToken();
        return await request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
      } catch (error) {
        handleAuthError();
      }
    }

    // 如果是blob响应，直接返回
    if (responseType === 'blob') {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Download failed');
      }
      return await (response.blob() as Promise<T>);
    }

    const result = await response.json();
    // 处理成功响应
    if (result.code === ResultEnum.SUCCESS) {
      return result.data;
    }

    // 处理其他错误
    throw new Error(result.msg || '请求失败');
  } catch (error) {
    // 只对需要认证的接口处理认证错误
    if ((error as Error).message === '认证失败' && !shouldSkipAuth) {
      handleAuthError();
    }
    throw error;
  }
}

// 导出请求方法
export const get = <T>(url: string, config?: Omit<RequestConfig, 'data'>) =>
  request<T>(url, { ...config, method: 'GET' });

export const post = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'data'>) =>
  request<T>(url, { ...config, method: 'POST', data });

export const put = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'data'>) =>
  request<T>(url, { ...config, method: 'PUT', data });

export const del = <T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'data'>) =>
  request<T>(url, { ...config, method: 'DELETE', data });

export const apiClient = { get, post, put, del };
export default apiClient;
