import { useState, useEffect } from 'react';

import type { HomePageData } from '@/common/typings/home';
import { PageErrorType } from '@/common/components/page-status-view/utils';
import { getPageErrorType } from '@/common/components/page-status-view/utils';
import { fetchHomePage } from '@/service/home';

interface UseFetchDataResult {
  isLoading: boolean;
  errorType?: PageErrorType;
  data?: HomePageData;
  handleRetry: () => void;
}

const useFetchData = (): UseFetchDataResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType>();
  const [data, setData] = useState<HomePageData>();

  const fetcher = async (): Promise<void> => {
    setIsLoading(true);
    setErrorType(undefined);
    try {
      const response = await fetchHomePage();
      const error = getPageErrorType(response);
      if (error !== undefined) {
        setErrorType(error);
        return;
      }
      if (response.success) {
        setData(response.data);
      }
    } catch {
      setErrorType(PageErrorType.NETWORK);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetcher();
  }, []);

  const handleRetry = (): void => {
    void fetcher();
  };

  return { isLoading, errorType, data, handleRetry };
};

export default useFetchData;
