import type { ApiResponse } from '@/common/typings/api';
import type { ProfilePageData } from '@/common/typings/profile';
import { postSafe } from '@/services';

/** Fetch all data for the Profile page. */
export function fetchProfilePage(): Promise<ApiResponse<ProfilePageData>> {
  return postSafe<ProfilePageData>('profile/detail/v1');
}
