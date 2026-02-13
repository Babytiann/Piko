import type { ProfilePageData } from '@/common/typings/profile';
import { post } from '@/common/services/api-client';

/** Fetch all data for the Profile page. */
export function fetchProfilePage(session?: string): Promise<ProfilePageData> {
  return post<ProfilePageData>('profile/detail/v1', { session });
}
