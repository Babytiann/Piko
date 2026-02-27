import type { ApiResponse } from '@/common/typings/api';
import type { HomeSlashResponse } from '@/common/typings/home';
import { fetch } from '@/services';

/** Fetch all data for the Home page (Slash: layout + nodes). */
export function fetchHomePage(): Promise<ApiResponse<HomeSlashResponse>> {
  return fetch<Record<string, never>, HomeSlashResponse>({
    method: 'POST',
    path: 'homepage/summary/v1',
    body: {},
  });
}
