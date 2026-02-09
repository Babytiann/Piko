import { useEffect, useCallback } from 'react';
import type { ChatDetailPageData } from '@/types/chat';
import type { PageDataState } from './usePageData';
import { usePageDataContext, getEntry } from '@/contexts/page-data-context';
import { fetchChatDetailPage } from '@/services/chat';

/**
 * Chat detail pages are NOT pre-fetched (dynamic keys).
 * The hook triggers a `request` on mount and when chatId changes.
 */
export function useChatDetailPage(
  session: string | null,
  chatId: string,
  chatType: string,
  accessHash: string,
  title: string,
): PageDataState<ChatDetailPageData> {
  const key = `chatDetail:${chatId}`;
  const { entries, request, refresh } = usePageDataContext();

  useEffect(() => {
    if (session && chatId) {
      request(key, () =>
        fetchChatDetailPage(session, chatId, chatType, accessHash, title),
      );
    }
  }, [session, chatId, chatType, accessHash, title, key, request]);

  const entry = getEntry(entries, key);

  return {
    data: (entry.data as ChatDetailPageData) ?? null,
    loading: entry.loading,
    error: entry.error,
    refresh: useCallback(
      () =>
        session
          ? refresh(key, () =>
              fetchChatDetailPage(session, chatId, chatType, accessHash, title),
            )
          : Promise.resolve(),
      [refresh, session, key, chatId, chatType, accessHash, title],
    ),
  };
}
