import { useState, useEffect } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { ChatDetailPageData, MessageItem } from '@/common/typings/chat';
import { fetchChatDetailPage } from '@/services/chat';

import { mergeLatestMessages } from '../utils/mergeMessages';

interface ChatDetailParams {
  session: string | null;
  chatId: string;
  chatType: string;
  accessHash: string;
  title: string;
}

interface UseChatDetailDataReturn {
  isLoading: boolean;
  errorType: PageErrorType | undefined;
  pageData: ChatDetailPageData | null;
  messages: MessageItem[];
  hasMore: boolean;
  loadingMore: boolean;
  handleRetry: () => void;
  handleLoadMore: () => void;
  mergeMessages: (freshBatch: MessageItem[]) => void;
  prependOptimistic: (msg: MessageItem) => void;
}

export function useChatDetailData(
  params: ChatDetailParams,
): UseChatDetailDataReturn {
  const { session, chatId, chatType, accessHash, title } = params;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [pageData, setPageData] = useState<ChatDetailPageData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [fetchKey, setFetchKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorType(undefined);

    async function load(): Promise<void> {
      try {
        const response = await fetchChatDetailPage(
          session ?? '',
          chatId,
          chatType,
          accessHash,
          title,
        );
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          setErrorType(mappedError);
          setPageData(null);
          setMessages([]);
        } else if (response.data) {
          setPageData(response.data);
          setMessages(response.data.messages);
          setHasMore(response.data.has_more);
        }
      } catch {
        if (cancelled) return;
        setErrorType(PageErrorType.NETWORK);
        setPageData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, chatId, chatType, accessHash, title, fetchKey]);

  const handleRetry = (): void => {
    setFetchKey((k) => k + 1);
  };

  const handleLoadMore = (): void => {
    if (loadingMore || !hasMore || !session || !chatId || messages.length === 0)
      return;

    setLoadingMore(true);
    const oldestId = messages[messages.length - 1].id;

    void fetchChatDetailPage(
      session,
      chatId,
      chatType,
      accessHash,
      title,
      oldestId,
    )
      .then((response) => {
        if (response.success && response.data) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const olderMsgs = response.data.messages.filter(
              (m) => !existingIds.has(m.id),
            );
            return [...prev, ...olderMsgs];
          });
          setHasMore(response.data.has_more);
        }
      })
      .catch(() => {
        // Silently fail — user can scroll up again to retry
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const mergeMessages = (freshBatch: MessageItem[]): void => {
    setMessages((prev) => mergeLatestMessages(prev, freshBatch));
  };

  const prependOptimistic = (msg: MessageItem): void => {
    setMessages((prev) => [msg, ...prev]);
  };

  return {
    isLoading,
    errorType,
    pageData,
    messages,
    hasMore,
    loadingMore,
    handleRetry,
    handleLoadMore,
    mergeMessages,
    prependOptimistic,
  };
}
