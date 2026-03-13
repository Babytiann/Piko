import { useState, useEffect, useCallback, useRef } from 'react';
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

const MIN_REFRESH_INTERVAL_MS = 5000;

export default function useFetchAiPageData(
  appSessionUserId?: string | null,
): UseFetchAiPageDataReturn {
  const pathname = usePathname();
  const cacheKey = normalizeCacheKey(pathname ?? '/ai');
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const lastFetchTimeRef = useRef<number>(0);
  const [data, setData] = useState<AiPageData | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    if (
      appSessionUserId != null &&
      prevUserIdRef.current !== appSessionUserId
    ) {
      clear(cacheKey);
      setData(null);
    }
    prevUserIdRef.current = appSessionUserId ?? null;

    let cancelled = false;
    const cached = get<AiCachePayload>(cacheKey);
    const hadCache = cached != null && cached.data != null;

    const now = Date.now();
    const shouldThrottle =
      hadCache && now - lastFetchTimeRef.current < MIN_REFRESH_INTERVAL_MS;

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
        const response = await fetchAiPageData(controller.signal);
        if (cancelled) return;

        lastFetchTimeRef.current = Date.now();

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

    if (!shouldThrottle) {
      void load();
    } else {
      setIsPageLoading(false);
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheKey, fetchKey, appSessionUserId]);

  const handleRetry = useCallback((): void => {
    clear(cacheKey);
    setIsPageLoading(true);
    setErrorType(undefined);
    setFetchKey((k) => k + 1);
  }, [cacheKey]);

  return { data, isPageLoading, errorType, handleRetry };
}
