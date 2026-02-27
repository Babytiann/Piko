import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'expo-router';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { deepEqual } from '@/common/utils';
import { get, set, clear } from '@/common/lib/route-cache';
import type { ProfilePageData } from '@/common/typings/profile';
import { fetchProfilePage } from '@/services/profile';

interface ProfileCachePayload {
  data: ProfilePageData | null;
}

interface UseProfileDataReturn {
  isPageLoading: boolean;
  errorType: PageErrorType | undefined;
  data: ProfilePageData | null;
  handleRetry: () => void;
}

function normalizeCacheKey(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

/**
 * @param session Telegram session（来自 useAuth），可选
 * @param appSessionUserId Apple 登录用户 id（来自 authClient.useSession()），用于 Apple 登录后自动 refetch，换设备后能拿到最新绑定状态
 */
export function useProfileData(
  session: string | null,
  appSessionUserId?: string | null,
): UseProfileDataReturn {
  const pathname = usePathname();
  const baseKey = normalizeCacheKey(pathname ?? '/profile');
  const cacheKey = `${baseKey}:${session ?? ''}:${appSessionUserId ?? ''}`;
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [fetchKey, setFetchKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const cached = get<ProfileCachePayload>(cacheKey);
    const hadCache = cached != null && cached.data != null;

    if (hadCache) {
      setData(cached.data);
      setIsPageLoading(false);
      setErrorType(undefined);
    } else {
      setIsPageLoading(true);
      setErrorType(undefined);
    }

    async function load(): Promise<void> {
      try {
        const response = await fetchProfilePage(session);
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          if (!hadCache) {
            setErrorType(mappedError);
            setData(null);
          }
        } else {
          const nextData = response.data ?? null;
          const fresh: ProfileCachePayload = { data: nextData };

          if (hadCache) {
            if (!deepEqual(fresh, cached)) {
              setData(nextData);
              set(cacheKey, fresh);
            }
          } else {
            setData(nextData);
            set(cacheKey, fresh);
          }
        }
      } catch {
        if (cancelled) return;
        if (!hadCache) {
          setErrorType(PageErrorType.NETWORK);
          setData(null);
        }
      } finally {
        if (!cancelled && !hadCache) setIsPageLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, cacheKey, fetchKey, appSessionUserId]);

  const handleRetry = useCallback((): void => {
    clear(cacheKey);
    setIsPageLoading(true);
    setErrorType(undefined);
    setFetchKey((k) => k + 1);
  }, [cacheKey]);

  return { isPageLoading, errorType, data, handleRetry };
}
