import type { ApiResponse } from '@/types/api';

export const API_HOST = 'http://100.83.217.199:3000';
const API_BASE = `${API_HOST}/piko`;

/**
 * Typed POST helper. Sends JSON and unwraps the `{ success, data }` envelope.
 * Use for page-data endpoints that follow the ApiResponse convention.
 */
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

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? `Request failed (${response.status})`);
  }

  return json.data as T;
}

/**
 * Typed POST helper that returns the raw JSON body (no envelope unwrapping).
 * Use for legacy endpoints (e.g. Telegram auth) that return data at the root level.
 */
export async function postDirect<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return data as T;
}
