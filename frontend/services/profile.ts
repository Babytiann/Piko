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

export interface ClearUserDataResult {
  expenses: number;
  conversations: number;
  budget: number;
}

export function updateProfile(updates: {
  nickname?: string;
  weather_city?: string | null;
}): Promise<ApiResponse<unknown>> {
  const body: { nickname?: string; weather_city?: string | null } = {};
  if (updates.nickname !== undefined) body.nickname = updates.nickname.trim();
  if (updates.weather_city !== undefined)
    body.weather_city = updates.weather_city;
  return fetch<typeof body, unknown>({
    method: 'PATCH',
    path: 'profile/update',
    body,
  });
}

export function deleteAccount(): Promise<ApiResponse<unknown>> {
  return fetch<Record<string, never>, unknown>({
    method: 'DELETE',
    path: 'profile/account',
  });
}

export function clearUserData(): Promise<
  ApiResponse<{ cleared: ClearUserDataResult }>
> {
  return fetch<Record<string, never>, { cleared: ClearUserDataResult }>({
    method: 'POST',
    path: 'profile/clear-data',
    body: {},
  });
}
