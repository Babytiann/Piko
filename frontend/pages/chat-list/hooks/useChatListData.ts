import { useState, useEffect, useRef } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { ChatListPageData } from '@/common/typings/chat';
import { fetchChatListPage } from '@/services/chat';

interface UseChatListDataReturn {
  isLoading: boolean;
  isRefreshing: boolean;
  errorType: PageErrorType | undefined;
  data: ChatListPageData | null;
  handleRetry: () => void;
  handleRefresh: () => void;
}

export function useChatListData(session: string | null): UseChatListDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [data, setData] = useState<ChatListPageData | null>(null);
  const [fetchKey, setFetchKey] = useState<number>(0);
  const fetchModeRef = useRef<'load' | 'refresh'>('load');

  useEffect(() => {
    let cancelled = false;
    const isRefresh = fetchModeRef.current === 'refresh';
    fetchModeRef.current = 'load';

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setErrorType(undefined);
    }

    async function load(): Promise<void> {
      try {
        const response = await fetchChatListPage(session ?? undefined);
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          setErrorType(mappedError);
          setData(null);
        } else {
          setErrorType(undefined);
          setData(response.data ?? null);
        }
      } catch {
        if (cancelled) return;
        setErrorType(PageErrorType.NETWORK);
        setData(null);
      } finally {
        if (!cancelled) {
          if (isRefresh) setIsRefreshing(false);
          else setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, fetchKey]);

  const handleRetry = (): void => {
    setFetchKey((k) => k + 1);
  };

  const handleRefresh = (): void => {
    fetchModeRef.current = 'refresh';
    setFetchKey((k) => k + 1);
  };

  return {
    isLoading,
    isRefreshing,
    errorType,
    data,
    handleRetry,
    handleRefresh,
  };
}
