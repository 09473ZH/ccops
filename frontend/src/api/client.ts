/**
 * API 客户端
 *
 * 提供统一的 HTTP 请求封装，包括：
 * - 自动处理请求头（Content-Type, Authorization）
 * - 支持双token认证（access token 和 refresh token）
 * - 支持 token 自动刷新
 * - 支持 JSON 和 FormData 请求
 * - 统一的错误处理
 * - 类型安全的请求方法
 */

import useUserStore from '@/store/user';

import { AuthApi } from './constants';

import { ResultEnum } from '#/enum';

type RequestConfig = RequestInit & {
  data?: unknown;
  skipAuth?: boolean; // 是否跳过认证
  retryCount?: number; // 重试次数
  responseType?: string;
};

const BASE_URL = import.meta.env.VITE_APP_BASE_API;

// 白名单接口列表
const whiteList: string[] = [AuthApi.Login, AuthApi.Refresh];

// 用于存储刷新 token 的 Promise
let refreshTokenPromise: Promise<void> | null = null;
// 请求队列
let requestQueue: Array<() => Promise<void>> = [];
// token是否正在刷新
let isRefreshing = false;

const TOKEN_EXPIRE_AHEAD_TIME = 5 * 60; // 提前5分钟过期，单位：秒

// 判断token是否过期
function isTokenExpired(): boolean {
  const { tokenInfo } = useUserStore.getState();
  if (!tokenInfo.accessToken) return true;
  if (!tokenInfo.expireAt) return true;

  return tokenInfo.expireAt < Date.now() / 1000 + TOKEN_EXPIRE_AHEAD_TIME;
}

// 清理刷新token相关状态
function cleanupRefreshState() {
  refreshTokenPromise = null;
  requestQueue = [];
  isRefreshing = false;
}

// 刷新 token
async function refreshToken(): Promise<void> {
  try {
    if (refreshTokenPromise) return await refreshTokenPromise;

    const { tokenInfo } = useUserStore.getState();
    if (!tokenInfo.refreshToken) throw new Error('No refresh token');

    isRefreshing = true;
    refreshTokenPromise = (async () => {
      try {
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

          // 执行队列中的请求
          requestQueue.forEach((callback) => callback());
        } else {
          throw new Error(data.msg || 'Refresh failed');
        }
      } catch (error) {
        useUserStore.getState().actions.clearToken();
        throw error;
      } finally {
        cleanupRefreshState();
      }
    })();

    return await refreshTokenPromise;
  } catch (error) {
    cleanupRefreshState();
    useUserStore.getState().actions.clearToken();
    throw error;
  }
}

function handleAuthError() {
  window.location.href = '/login';
  throw new Error('认证失败');
}

// 统一的请求处理
async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { skipAuth, retryCount = 0, data, responseType, ...restConfig } = config;

  // 只有不在白名单的接口才检查token
  if (!skipAuth && !whiteList.includes(endpoint) && isTokenExpired()) {
    if (isRefreshing) {
      // 将请求加入队列
      return new Promise((resolve, reject) => {
        requestQueue.push(async () => {
          try {
            const result = await request<T>(endpoint, config);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }
    try {
      await refreshToken();
    } catch (error) {
      handleAuthError();
    }
  }

  // 构建基础请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 添加认证头，白名单接口不添加token
  if (!skipAuth && !whiteList.includes(endpoint)) {
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

    if (response.status === 401 && !skipAuth) {
      if (retryCount < 1) {
        try {
          await refreshToken();
          return await request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
        } catch (error) {
          handleAuthError();
        }
      }
      handleAuthError();
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
    if ((error as Error).message === '认证失败') {
      handleAuthError();
    }
    console.error('Request error:', error);
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
