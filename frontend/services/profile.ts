import type { ApiResponse } from '@/common/typings/api';
import type { ProfilePageData } from '@/common/typings/profile';
import { fetch } from '@/services';

/** Fetch all data for the Profile page. Pass Telegram session when available so backend can use it as fallback. */
export function fetchProfilePage(
  session?: string | null,
): Promise<ApiResponse<ProfilePageData>> {
  return fetch<{ session?: string }, ProfilePageData>({
    method: 'POST',
    path: 'profile/detail/v1',
    body: { session: session ?? undefined },
  });
}
