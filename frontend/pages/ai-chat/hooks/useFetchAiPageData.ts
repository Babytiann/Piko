import { useState, useEffect } from 'react';
import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { fetchAiPageData } from '@/services/ai';
import type { AiPageData } from '../types';

interface UseFetchAiPageDataReturn {
  data: AiPageData | null;
  isPageLoading: boolean;
  errorType: PageErrorType | undefined;
  handleRetry: () => void;
}

export default function useFetchAiPageData(): UseFetchAiPageDataReturn {
  const [data, setData] = useState<AiPageData | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [fetchKey, setFetchKey] = useState(0);

  async function load(): Promise<void> {
    const response = await fetchAiPageData();

    const mappedError = getPageErrorType(response);
    if (mappedError) {
      setErrorType(mappedError);
      setData({} as AiPageData);
    } else {
      setData(response.data ?? null);
    }

    setIsPageLoading(false);
  }

  useEffect(() => {
    void load();
  }, [fetchKey]);

  const handleRetry = (): void => {
    setIsPageLoading(true);
    setErrorType(undefined);
    setFetchKey((k) => k + 1);
  };

  return { data, isPageLoading, errorType, handleRetry };
}
