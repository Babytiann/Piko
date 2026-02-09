import type { ProfilePageData } from '@/types/profile';
import { post } from './api-client';

/** Fetch all data for the Profile page. */
export function fetchProfilePage(session?: string): Promise<ProfilePageData> {
  return post<ProfilePageData>('profile/detail/v1', { session });
}
