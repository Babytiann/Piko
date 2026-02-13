import { useState, useEffect } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { HomePageData } from '@/common/typings/home';
import { fetchHomePage } from '@/services/home';

interface UseFetchDataReturn {
  isLoading: boolean;
  errorType: PageErrorType | undefined;
  data: HomePageData | null;
  handleRetry: () => void;
}

export function useFetchData(): UseFetchDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [data, setData] = useState<HomePageData | null>(null);
  const [fetchKey, setFetchKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorType(undefined);

    async function load(): Promise<void> {
      try {
        const response = await fetchHomePage();
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          setErrorType(mappedError);
          setData(null);
        } else {
          setData(response.data ?? null);
        }
      } catch {
        if (cancelled) return;
        setErrorType(PageErrorType.NETWORK);
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const handleRetry = (): void => {
    setFetchKey((k) => k + 1);
  };

  return { isLoading, errorType, data, handleRetry };
}
