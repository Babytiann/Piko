import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchHomePage } from '@/services/home';
import { fetchProfilePage } from '@/services/profile';
import { fetchChatListPage } from '@/services/chat';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'page_data_';

export interface PageEntry {
  data: unknown;
  loading: boolean;
  error: string;
}

const EMPTY_ENTRY: PageEntry = { data: null, loading: true, error: '' };

interface PageDataContextValue {
  entries: Record<string, PageEntry>;
  /**
   * Request data for a page key. If a fetch is already in-flight for this key,
   * the call is a no-op. If cached data exists, the request revalidates
   * silently in the background (no loading state).
   */
  request: (key: string, fetcher: () => Promise<unknown>) => void;
  /**
   * Force refresh a page key. Shows loading state and awaits the result.
   */
  refresh: (key: string, fetcher: () => Promise<unknown>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PageDataContext = createContext<PageDataContextValue | null>(null);

export function usePageDataContext(): PageDataContextValue {
  const ctx = useContext(PageDataContext);
  if (!ctx) {
    throw new Error(
      'usePageDataContext must be used inside <PageDataProvider>',
    );
  }
  return ctx;
}

/** Read an entry from the entries map, returning a safe default if absent. */
export function getEntry(
  entries: Record<string, PageEntry>,
  key: string,
): PageEntry {
  return entries[key] ?? EMPTY_ENTRY;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ProviderProps {
  session: string | null;
  children: ReactNode;
}

export function PageDataProvider({ session, children }: ProviderProps) {
  const [entries, setEntries] = useState<Record<string, PageEntry>>({});

  // Refs for stable callbacks (avoid re-creating on every render)
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const inflightRef = useRef(new Set<string>());

  // ---------------------------
  // Cache: load from AsyncStorage on mount
  // ---------------------------
  useEffect(() => {
    (async () => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length === 0) return;

        const pairs = await AsyncStorage.multiGet(cacheKeys);
        const loaded: Record<string, PageEntry> = {};
        for (const [storageKey, value] of pairs) {
          if (value) {
            const pageKey = storageKey.slice(CACHE_PREFIX.length);
            loaded[pageKey] = {
              data: JSON.parse(value),
              loading: false,
              error: '',
            };
          }
        }

        setEntries((prev) => {
          const merged = { ...loaded };
          // Fresh in-memory data wins over stale cache
          for (const [k, v] of Object.entries(prev)) {
            if (v.data !== null) merged[k] = v;
          }
          return merged;
        });
      } catch (err) {
        console.error('Failed to load page data cache:', err);
      }
    })();
  }, []);

  // ---------------------------
  // Core: fetch + persist helper
  // ---------------------------
  const doFetch = useCallback(
    (key: string, fetcher: () => Promise<unknown>, showLoading: boolean) => {
      if (showLoading) {
        setEntries((prev) => ({
          ...prev,
          [key]: { data: prev[key]?.data ?? null, loading: true, error: '' },
        }));
      }

      fetcher()
        .then((data) => {
          setEntries((prev) => ({
            ...prev,
            [key]: { data, loading: false, error: '' },
          }));
          AsyncStorage.setItem(
            `${CACHE_PREFIX}${key}`,
            JSON.stringify(data),
          ).catch(() => {});
        })
        .catch((err: unknown) => {
          setEntries((prev) => ({
            ...prev,
            [key]: {
              data: prev[key]?.data ?? null,
              loading: false,
              error: err instanceof Error ? err.message : '加载失败',
            },
          }));
        })
        .finally(() => {
          inflightRef.current.delete(key);
        });
    },
    [],
  );

  // ---------------------------
  // Public: request (stale-while-revalidate)
  // ---------------------------
  const request = useCallback(
    (key: string, fetcher: () => Promise<unknown>) => {
      if (inflightRef.current.has(key)) return;
      inflightRef.current.add(key);
      const hasData = entriesRef.current[key]?.data != null;
      doFetch(key, fetcher, !hasData);
    },
    [doFetch],
  );

  // ---------------------------
  // Public: refresh (forced, shows loading)
  // ---------------------------
  const refresh = useCallback(
    async (key: string, fetcher: () => Promise<unknown>) => {
      inflightRef.current.delete(key);
      inflightRef.current.add(key);

      setEntries((prev) => ({
        ...prev,
        [key]: { data: prev[key]?.data ?? null, loading: true, error: '' },
      }));

      try {
        const data = await fetcher();
        setEntries((prev) => ({
          ...prev,
          [key]: { data, loading: false, error: '' },
        }));
        await AsyncStorage.setItem(
          `${CACHE_PREFIX}${key}`,
          JSON.stringify(data),
        );
      } catch (err: unknown) {
        setEntries((prev) => ({
          ...prev,
          [key]: {
            data: prev[key]?.data ?? null,
            loading: false,
            error: err instanceof Error ? err.message : '加载失败',
          },
        }));
      } finally {
        inflightRef.current.delete(key);
      }
    },
    [],
  );

  // ---------------------------
  // Prefetch all tab pages when session changes
  // ---------------------------
  useEffect(() => {
    // Clear inflight for session-dependent pages so they re-fetch
    inflightRef.current.delete('profile');
    inflightRef.current.delete('chatList');

    request('home', () => fetchHomePage());
    request('profile', () => fetchProfilePage(session ?? undefined));
    request('chatList', () => fetchChatListPage(session ?? undefined));
  }, [session, request]);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <PageDataContext.Provider value={{ entries, request, refresh }}>
      {children}
    </PageDataContext.Provider>
  );
}
