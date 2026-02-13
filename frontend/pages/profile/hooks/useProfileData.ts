import { useState, useEffect, useCallback } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { ProfilePageData } from '@/common/typings/profile';
import { fetchProfilePage } from '@/service/profile';

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

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorType(undefined);

    try {
      const response = await fetchProfilePage(session ?? undefined);
      const mappedError = getPageErrorType(response);

      if (mappedError) {
        setErrorType(mappedError);
        setData(null);
      } else {
        setData(response.data ?? null);
      }
    } catch {
      setErrorType(PageErrorType.NETWORK);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = useCallback((): void => {
    void load();
  }, [load]);

  return { isLoading, errorType, data, handleRetry };
}
