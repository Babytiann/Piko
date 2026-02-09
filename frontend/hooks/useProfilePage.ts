import { useCallback } from 'react';
import type { ProfilePageData } from '@/types/profile';
import type { PageDataState } from './usePageData';
import { usePageDataContext, getEntry } from '@/contexts/page-data-context';
import { fetchProfilePage } from '@/services/profile';

const KEY = 'profile';

export function useProfilePage(
  session: string | null,
): PageDataState<ProfilePageData> {
  const { entries, refresh } = usePageDataContext();
  const entry = getEntry(entries, KEY);

  return {
    data: (entry.data as ProfilePageData) ?? null,
    loading: entry.loading,
    error: entry.error,
    refresh: useCallback(
      () => refresh(KEY, () => fetchProfilePage(session ?? undefined)),
      [refresh, session],
    ),
  };
}
