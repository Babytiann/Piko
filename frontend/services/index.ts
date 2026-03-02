import type { ApiResponse } from '@/common/typings/api';
import { API_HOST } from '@/common/config';
import { authClient } from '@/services/auth-client';

const API_BASE = API_HOST;

// 启动时打一次 log，方便确认当前请求的根地址（排查 EXPO_PUBLIC_API_HOST / Vercel 域名）
if (__DEV__) {
  console.log('[API] API_HOST:', API_HOST);
  console.log('[API] API_BASE:', API_BASE);
}

const nativeFetch = globalThis.fetch;

/** 请求超时时间（毫秒），避免 Vercel 冷启动或后端卡住时无限转圈 */
const REQUEST_TIMEOUT_MS = 30_000;

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface FetchRequest<P = Record<string, unknown>> {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  params?: P;
  body?: Record<string, unknown>;
  raw?: boolean;
}

export type FetchResponse<T> = ApiResponse<T> & { status?: number };

function getAuthHeaders(): Record<string, string> {
  const cookie = authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}

async function doRequest<P>(
  args: Omit<FetchRequest<P>, 'raw'>,
): Promise<{ response: Response; data: unknown }> {
  const { method, path, params, body } = args;
  const url = new URL(`${API_BASE}/${path}`);

  if (method === 'GET' && params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };

  const init: RequestInit = {
    method,
    headers,
  };

  if ((method === 'POST' || method === 'PATCH') && body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const fullUrl = url.toString();
  if (__DEV__) {
    console.log('[API] →', method, fullUrl);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  init.signal = controller.signal;

  const response = await nativeFetch(fullUrl, init);
  clearTimeout(timeoutId);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (__DEV__) {
    const status = response.status;
    const ok = response.ok;
    if (!ok) {
      console.warn('[API] ←', status, fullUrl, data ?? '(no body)');
    } else {
      console.log('[API] ←', status, fullUrl);
    }
  }

  return { response, data };
}

export async function fetch<P, R>(
  args: FetchRequest<P>,
): Promise<FetchResponse<R>> {
  const { raw, ...rest } = args;

  try {
    const { response, data } = await doRequest(rest);

    if (raw) {
      if (response.ok) {
        return { success: true, data: data as R, status: response.status };
      }
      const err = data as Record<string, unknown> | undefined;
      return {
        success: false,
        error:
          typeof err?.error === 'string'
            ? err.error
            : `Request failed (${response.status})`,
        ...(typeof err?.error_code === 'string'
          ? { error_code: err.error_code }
          : {}),
        status: response.status,
      };
    }

    if (!response.ok) {
      const err = data as Record<string, unknown> | undefined;
      return {
        success: false,
        error:
          typeof err?.error === 'string'
            ? err.error
            : `Request failed (${response.status})`,
        ...(typeof err?.error_code === 'string'
          ? { error_code: err.error_code }
          : {}),
        status: response.status,
      };
    }

    if (data === undefined) {
      return { success: false, error: 'Invalid response' };
    }

    return { ...(data as ApiResponse<R>), status: response.status };
  } catch (e) {
    if (__DEV__) {
      console.warn('[API] Network error', e);
    }
    const isAbort = e instanceof Error && e.name === 'AbortError';
    if (__DEV__ && isAbort) {
      console.warn('[API] 请求超时', rest.path);
    }
    return {
      success: false,
      error: isAbort ? '请求超时，请稍后重试' : 'Network error',
    };
  }
}
