import type { ApiResponse } from '@/common/typings/api';
import { API_HOST } from '@/common/config';

const API_BASE = `${API_HOST}/piko`;

/**
 * 返回认证相关的 HTTP headers。
 *
 * Mock 阶段：发送 X-Mock-User-Id。
 * Apple Sign In 接入后：改为发送 Authorization: Bearer <jwt>。
 */
function getAuthHeaders(): Record<string, string> {
  // TODO: Apple 登录接入后替换为：
  // const token = await getToken(); // 从 expo-secure-store 读取
  // return token ? { Authorization: `Bearer ${token}` } : {};
  return { 'X-Mock-User-Id': 'mock-user-001' };
}

export async function post<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error ?? `Request failed (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return json.data;
}

export async function postSafe<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!response.ok && json.success) {
      return { success: false, error: `Request failed (${response.status})` };
    }

    // 透传后端返回的 errorCode（如 AUTH_EXPIRED）
    if (!json.success && json.errorCode) {
      return { success: false, error: json.error, errorCode: json.errorCode };
    }

    return json as ApiResponse<T>;
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function postDirect<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as Record<string, unknown>;
    throw new Error(
      typeof errorData.error === 'string'
        ? errorData.error
        : `Request failed (${response.status})`,
    );
  }

  return data as T;
}
