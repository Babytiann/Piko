import { useState, useEffect, useCallback, useRef } from 'react';

export interface PageDataOptions {
  pollingInterval?: number;
}

export interface PageDataState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  silentRefresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export default function usePageData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: PageDataOptions,
): PageDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      setError('');
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    }
  }, []);

  const silentLoad = useCallback(async () => {
    const result = await fetcherRef.current();
    setData(result);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, deps);

  const pollingInterval = options?.pollingInterval;
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) return;

    const id = setInterval(silentLoad, pollingInterval);
    return () => clearInterval(id);
  }, [pollingInterval, silentLoad]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  const silentRefresh = useCallback(async () => {
    await silentLoad();
  }, [silentLoad]);

  return { data, loading, error, refresh, silentRefresh, setData };
}
