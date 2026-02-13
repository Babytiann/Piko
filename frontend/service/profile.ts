import type { ApiResponse } from '@/common/typings/api';
import type { ProfilePageData } from '@/common/typings/profile';
import { postSafe } from '@/common/services/api-client';

/** Fetch all data for the Profile page. */
export function fetchProfilePage(
  session?: string,
): Promise<ApiResponse<ProfilePageData>> {
  return postSafe<ProfilePageData>('profile/detail/v1', { session });
}
