import { useCallback } from 'react';
import type { HomePageData } from '@/types/home';
import type { PageDataState } from './usePageData';
import { usePageDataContext, getEntry } from '@/contexts/page-data-context';
import { fetchHomePage } from '@/services/home';

const KEY = 'home';

export function useHomePage(): PageDataState<HomePageData> {
  const { entries, refresh } = usePageDataContext();
  const entry = getEntry(entries, KEY);

  return {
    data: (entry.data as HomePageData) ?? null,
    loading: entry.loading,
    error: entry.error,
    refresh: useCallback(() => refresh(KEY, () => fetchHomePage()), [refresh]),
  };
}
