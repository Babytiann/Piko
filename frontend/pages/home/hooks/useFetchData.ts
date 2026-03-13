import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'expo-router';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { deepEqual } from '@/common/utils';
import { get, set, clear } from '@/common/lib/route-cache';
import type {
  HomeLabels,
  HomeSlashNodes,
  HomeSlashResponse,
  WeatherCityOption,
} from '@/common/typings/home';
import { fetchHomePage } from '@/services/home';

interface HomeCachePayload {
  bodyLayout: string[];
  nodes: HomeSlashNodes | undefined;
  labels: HomeLabels | undefined;
  weatherCityOptions: WeatherCityOption[] | undefined;
}

interface UseFetchDataReturn {
  isLoading: boolean;
  errorType: PageErrorType | undefined;
  bodyLayout: string[];
  nodes: HomeSlashNodes | undefined;
  labels: HomeLabels | undefined;
  weatherCityOptions: WeatherCityOption[] | undefined;
  handleRetry: () => void;
  handleRefreshWithDate: (date?: string) => void;
  handleSilentRefresh: () => void;
}

function normalizeCacheKey(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

function hasCachedData(key: string): boolean {
  const cached = get<HomeCachePayload>(key);
  return cached != null && (cached.bodyLayout?.length ?? 0) > 0;
}

const MIN_REFRESH_INTERVAL_MS = 5000;

export function useFetchData(
  selectedDate?: string,
  weatherCity?: string,
  appSessionUserId?: string | null,
): UseFetchDataReturn {
  const pathname = usePathname();
  const cacheKey = normalizeCacheKey(pathname ?? '/');
  const initializedRef = useRef(false);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const prevWeatherCityRef = useRef<string | undefined>(undefined);
  const lastFetchTimeRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(() => !hasCachedData(cacheKey));
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [bodyLayout, setBodyLayout] = useState<string[]>(() => {
    const cached = get<HomeCachePayload>(cacheKey);
    return cached?.bodyLayout ?? [];
  });
  const [nodes, setNodes] = useState<HomeSlashNodes | undefined>(() => {
    const cached = get<HomeCachePayload>(cacheKey);
    return cached?.nodes ?? undefined;
  });
  const [labels, setLabels] = useState<HomeLabels | undefined>(() => {
    const cached = get<HomeCachePayload>(cacheKey);
    return cached?.labels ?? undefined;
  });
  const [weatherCityOptions, setWeatherCityOptions] = useState<
    WeatherCityOption[] | undefined
  >(() => {
    const cached = get<HomeCachePayload>(cacheKey);
    return cached?.weatherCityOptions ?? undefined;
  });
  const [fetchKey, setFetchKey] = useState(0);
  const [dateParam, setDateParam] = useState<string | undefined>(selectedDate);

  useEffect(() => {
    const controller = new AbortController();

    if (
      appSessionUserId != null &&
      prevUserIdRef.current !== appSessionUserId
    ) {
      clear(cacheKey);
      setBodyLayout([]);
      setNodes(undefined);
      setLabels(undefined);
      setWeatherCityOptions(undefined);
    }
    prevUserIdRef.current = appSessionUserId ?? null;

    let cancelled = false;
    const cached = get<HomeCachePayload>(cacheKey);
    const hadCache = cached != null && (cached.bodyLayout?.length ?? 0) > 0;
    const weatherCityChanged = prevWeatherCityRef.current !== weatherCity;
    if (weatherCityChanged) prevWeatherCityRef.current = weatherCity;
    const hasValidOptions = (cached?.weatherCityOptions?.length ?? 0) > 0;

    const now = Date.now();
    const shouldThrottle =
      hadCache &&
      !dateParam &&
      !weatherCityChanged &&
      hasValidOptions &&
      now - lastFetchTimeRef.current < MIN_REFRESH_INTERVAL_MS;

    if (!hadCache && !initializedRef.current) {
      setIsLoading(true);
      setErrorType(undefined);
    }
    initializedRef.current = true;

    async function load(): Promise<void> {
      try {
        const response = await fetchHomePage(
          dateParam,
          weatherCity,
          controller.signal,
        );
        if (cancelled) return;

        lastFetchTimeRef.current = Date.now();

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          if (!hadCache) {
            setErrorType(mappedError);
            setBodyLayout([]);
            setNodes(undefined);
            setLabels(undefined);
            setWeatherCityOptions(undefined);
          }
        } else {
          const data = response.data as HomeSlashResponse | null | undefined;
          const nextLayout = data?.layout?.body ?? [];
          let nextNodes = data?.nodes ?? undefined;
          const nextLabels = data?.labels ?? undefined;
          const nextWeatherCityOptions =
            data?.extra?.weather_city_options ?? undefined;
          if (__DEV__) {
            console.log(
              '[Home] fetch ok, weather_city_options:',
              nextWeatherCityOptions?.length ?? 0,
            );
          }
          if (
            nextNodes &&
            !nextNodes.weather_card &&
            nodes?.weather_card?.type === 'component' &&
            nodes.weather_card.data
          ) {
            nextNodes = { ...nextNodes, weather_card: nodes.weather_card };
          }
          const fresh: HomeCachePayload = {
            bodyLayout: nextLayout,
            nodes: nextNodes,
            labels: nextLabels,
            weatherCityOptions: nextWeatherCityOptions,
          };

          if (hadCache && !dateParam) {
            if (!deepEqual(fresh, cached)) {
              setBodyLayout(nextLayout);
              setNodes(nextNodes);
              setLabels(nextLabels);
              setWeatherCityOptions(nextWeatherCityOptions);
              set(cacheKey, fresh);
            }
          } else {
            setBodyLayout(nextLayout);
            setNodes(nextNodes);
            setLabels(nextLabels);
            setWeatherCityOptions(nextWeatherCityOptions);
            if (!dateParam) {
              set(cacheKey, fresh);
            }
          }
          setErrorType(undefined);
        }
      } catch {
        if (cancelled) return;
        if (!hadCache) {
          setErrorType(PageErrorType.NETWORK);
          setBodyLayout([]);
          setNodes(undefined);
          setLabels(undefined);
          setWeatherCityOptions(undefined);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (!shouldThrottle) {
      void load();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheKey, fetchKey, dateParam, weatherCity, appSessionUserId]);

  const handleRetry = useCallback((): void => {
    clear(cacheKey);
    setDateParam(undefined);
    setIsLoading(true);
    setFetchKey((k) => k + 1);
  }, [cacheKey]);

  const handleRefreshWithDate = useCallback((date?: string): void => {
    setDateParam(date);
    setFetchKey((k) => k + 1);
  }, []);

  const handleSilentRefresh = useCallback((): void => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    isLoading,
    errorType,
    bodyLayout,
    nodes,
    labels,
    weatherCityOptions,
    handleRetry,
    handleRefreshWithDate,
    handleSilentRefresh,
  };
}
