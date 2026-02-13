import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

function useFetchData<T>(fetcher: () => Promise<T>): UseFetchDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { data, isLoading, error, retry: execute };
}

export default useFetchData;
