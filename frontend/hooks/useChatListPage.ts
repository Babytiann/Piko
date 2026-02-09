import { useCallback } from 'react';
import type { ChatListPageData } from '@/types/chat';
import type { PageDataState } from './usePageData';
import { usePageDataContext, getEntry } from '@/contexts/page-data-context';
import { fetchChatListPage } from '@/services/chat';

const KEY = 'chatList';

export function useChatListPage(
  session: string | null,
): PageDataState<ChatListPageData> {
  const { entries, refresh } = usePageDataContext();
  const entry = getEntry(entries, KEY);

  return {
    data: (entry.data as ChatListPageData) ?? null,
    loading: entry.loading,
    error: entry.error,
    refresh: useCallback(
      () => refresh(KEY, () => fetchChatListPage(session ?? undefined)),
      [refresh, session],
    ),
  };
}
