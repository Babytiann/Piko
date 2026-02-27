import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'expo-router';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { deepEqual } from '@/common/utils';
import { get, set, clear } from '@/common/lib/route-cache';
import { fetchAiPageData } from '@/services/ai';
import type { AiPageData } from '../types';

interface AiCachePayload {
  data: AiPageData | null;
}

interface UseFetchAiPageDataReturn {
  data: AiPageData | null;
  isPageLoading: boolean;
  errorType: PageErrorType | undefined;
  handleRetry: () => void;
}

function normalizeCacheKey(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export default function useFetchAiPageData(): UseFetchAiPageDataReturn {
  const pathname = usePathname();
  const cacheKey = normalizeCacheKey(pathname ?? '/ai');
  const [data, setData] = useState<AiPageData | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cached = get<AiCachePayload>(cacheKey);
    const hadCache = cached != null && cached.data != null;

    if (hadCache) {
      setData(cached.data);
      setIsPageLoading(false);
      setErrorType(undefined);
    } else {
      setIsPageLoading(true);
      setErrorType(undefined);
    }

    async function load(): Promise<void> {
      try {
        const response = await fetchAiPageData();
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          if (!hadCache) {
            setErrorType(mappedError);
            setData({} as AiPageData);
          }
        } else {
          const nextData = response.data ?? null;
          const fresh: AiCachePayload = { data: nextData };

          if (hadCache) {
            if (!deepEqual(fresh, cached)) {
              setData(nextData);
              set(cacheKey, fresh);
            }
          } else {
            setData(nextData);
            set(cacheKey, fresh);
          }
        }
      } catch {
        if (cancelled) return;
        if (!hadCache) {
          setErrorType(PageErrorType.NETWORK);
          setData({} as AiPageData);
        }
      } finally {
        if (!cancelled && !hadCache) setIsPageLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, fetchKey]);

  const handleRetry = useCallback((): void => {
    clear(cacheKey);
    setIsPageLoading(true);
    setErrorType(undefined);
    setFetchKey((k) => k + 1);
  }, [cacheKey]);

  return { data, isPageLoading, errorType, handleRetry };
}
