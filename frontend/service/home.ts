import type { ApiResponse } from '@/common/typings/api';
import type { HomePageData } from '@/common/typings/home';
import { postSafe } from '@/common/services/api-client';

/** Fetch all data for the Home page. Returns ApiResponse for error mapping. */
export function fetchHomePage(): Promise<ApiResponse<HomePageData>> {
  return postSafe<HomePageData>('homepage/summary/v1');
}
