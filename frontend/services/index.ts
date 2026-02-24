import type { ApiResponse } from '@/common/typings/api';
import { API_HOST } from '@/common/config';
import { authClient } from '@/services/auth-client';

const API_BASE = `${API_HOST}/piko`;

/** 请求失败时抛出，便于按 status 做 UI 分支（如 409 账户已被绑定）。 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 返回认证相关的 HTTP headers（better-auth Cookie）。 */
function getAuthHeaders(): Record<string, string> {
  const cookie = authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
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
    const message =
      typeof errorData.error === 'string'
        ? errorData.error
        : `Request failed (${response.status})`;
    throw new HttpError(message, response.status);
  }

  return data as T;
}
