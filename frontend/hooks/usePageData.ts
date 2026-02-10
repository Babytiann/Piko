import { useState, useEffect, useCallback, useRef } from 'react';

export interface PageDataOptions {
  /** Interval in ms for background polling. When set, data is silently
   *  re-fetched on a timer without triggering the loading state. */
  pollingInterval?: number;
}

export interface PageDataState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

/**
 * Generic hook for fetching page-level data from the server.
 * Manages loading / error / data state and exposes a `refresh` callback.
 *
 * @param fetcher  Async function that returns the page data.
 * @param deps     Dependency array — refetches when any value changes.
 * @param options  Optional configuration (e.g. pollingInterval).
 */
export function usePageData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: PageDataOptions,
): PageDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep fetcher ref stable to avoid re-triggering on every render
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

  /** Silent refresh — does NOT set loading to true. Used by polling. */
  const silentLoad = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch {
      // Polling errors are swallowed to avoid flickering error UI
    }
  }, []);

  // Initial fetch & refetch on dependency change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Background polling
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

  return { data, loading, error, refresh };
}
