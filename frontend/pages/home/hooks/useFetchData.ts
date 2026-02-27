import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'expo-router';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { deepEqual } from '@/common/utils';
import { get, set, clear } from '@/common/lib/route-cache';
import type { HomeSlashNodes, HomeSlashResponse } from '@/common/typings/home';
import { fetchHomePage } from '@/services/home';

interface HomeCachePayload {
  bodyLayout: string[];
  nodes: HomeSlashNodes | undefined;
}

interface UseFetchDataReturn {
  isLoading: boolean;
  errorType: PageErrorType | undefined;
  bodyLayout: string[];
  nodes: HomeSlashNodes | undefined;
  handleRetry: () => void;
  handleRefreshWithDate: (date?: string) => void;
}

function normalizeCacheKey(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export function useFetchData(selectedDate?: string): UseFetchDataReturn {
  const pathname = usePathname();
  const cacheKey = normalizeCacheKey(pathname ?? '/');
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [bodyLayout, setBodyLayout] = useState<string[]>([]);
  const [nodes, setNodes] = useState<HomeSlashNodes | undefined>(undefined);
  const [fetchKey, setFetchKey] = useState(0);
  const [dateParam, setDateParam] = useState<string | undefined>(selectedDate);

  useEffect(() => {
    let cancelled = false;
    const cached = get<HomeCachePayload>(cacheKey);
    const hadCache = cached != null && (cached.bodyLayout?.length ?? 0) > 0;

    if (hadCache && !dateParam) {
      setBodyLayout(cached.bodyLayout ?? []);
      setNodes(cached.nodes ?? undefined);
      setIsLoading(false);
      setErrorType(undefined);
    } else if (!hadCache) {
      setIsLoading(true);
      setErrorType(undefined);
    }

    async function load(): Promise<void> {
      try {
        const response = await fetchHomePage(dateParam);
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          if (!hadCache) {
            setErrorType(mappedError);
            setBodyLayout([]);
            setNodes(undefined);
          }
        } else {
          const data = response.data as HomeSlashResponse | null | undefined;
          const nextLayout = data?.layout?.body ?? [];
          const nextNodes = data?.nodes ?? undefined;
          const fresh: HomeCachePayload = {
            bodyLayout: nextLayout,
            nodes: nextNodes,
          };

          if (hadCache && !dateParam) {
            if (!deepEqual(fresh, cached)) {
              setBodyLayout(nextLayout);
              setNodes(nextNodes);
              set(cacheKey, fresh);
            }
          } else {
            setBodyLayout(nextLayout);
            setNodes(nextNodes);
            if (!dateParam) {
              set(cacheKey, fresh);
            }
          }
        }
      } catch {
        if (cancelled) return;
        if (!hadCache) {
          setErrorType(PageErrorType.NETWORK);
          setBodyLayout([]);
          setNodes(undefined);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, fetchKey, dateParam]);

  const handleRetry = useCallback((): void => {
    clear(cacheKey);
    setDateParam(undefined);
    setFetchKey((k) => k + 1);
  }, [cacheKey]);

  const handleRefreshWithDate = useCallback((date?: string): void => {
    setDateParam(date);
    setFetchKey((k) => k + 1);
  }, []);

  return {
    isLoading,
    errorType,
    bodyLayout,
    nodes,
    handleRetry,
    handleRefreshWithDate,
  };
}
