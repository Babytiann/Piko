import type { ApiResponse } from '@/common/typings/api';
import type { HomePageData } from '@/common/typings/home';
import { fetch } from '@/services';

/** Fetch all data for the Home page. Returns ApiResponse for error mapping. */
export function fetchHomePage(): Promise<ApiResponse<HomePageData>> {
  return fetch<Record<string, never>, HomePageData>({
    method: 'POST',
    path: 'homepage/summary/v1',
    body: {},
  });
}
