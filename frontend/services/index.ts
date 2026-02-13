import type { ApiResponse } from '@/common/typings/api';

export const API_HOST = 'http://192.168.6.180:3000';
const API_BASE = `${API_HOST}/piko`;

export async function post<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok && json.success) {
      return { success: false, error: `Request failed (${response.status})` };
    }

    return json;
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
    headers: { 'Content-Type': 'application/json' },
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
