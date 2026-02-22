import { useState, useEffect } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { ProfilePageData } from '@/common/typings/profile';
import { fetchProfilePage } from '@/services/profile';

interface UseProfileDataReturn {
  isLoading: boolean;
  errorType: PageErrorType | undefined;
  data: ProfilePageData | null;
  handleRetry: () => void;
}

export function useProfileData(session: string | null): UseProfileDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [fetchKey, setFetchKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorType(undefined);

    async function load(): Promise<void> {
      try {
        const response = await fetchProfilePage();
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
  }, [session, fetchKey]);

  const handleRetry = (): void => {
    setFetchKey((k) => k + 1);
  };

  return { isLoading, errorType, data, handleRetry };
}
