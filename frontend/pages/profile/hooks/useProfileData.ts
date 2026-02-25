import { useState, useEffect } from 'react';

import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import type { ProfilePageData } from '@/common/typings/profile';
import { fetchProfilePage } from '@/services/profile';

interface UseProfileDataReturn {
  isPageLoading: boolean;
  errorType: PageErrorType | undefined;
  data: ProfilePageData | null;
  handleRetry: () => void;
}

/**
 * @param session Telegram session（来自 useAuth），可选
 * @param appSessionUserId Apple 登录用户 id（来自 authClient.useSession()），用于 Apple 登录后自动 refetch，换设备后能拿到最新绑定状态
 */
export function useProfileData(
  session: string | null,
  appSessionUserId?: string | null,
): UseProfileDataReturn {
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [fetchKey, setFetchKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setIsPageLoading(true);
    setErrorType(undefined);

    async function load(): Promise<void> {
      try {
        const response = await fetchProfilePage(session);
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
        if (!cancelled) setIsPageLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, fetchKey, appSessionUserId]);

  const handleRetry = (): void => {
    setIsPageLoading(true);
    setErrorType(undefined);
    setFetchKey((k) => k + 1);
  };

  return { isPageLoading, errorType, data, handleRetry };
}
