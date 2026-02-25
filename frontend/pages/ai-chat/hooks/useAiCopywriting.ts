import { useState, useEffect } from 'react';
import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { fetchAiCopywriting } from '@/services/ai';
import type { AiCopywriting } from '../types';

interface UseAiCopywritingReturn {
  copy: AiCopywriting | null;
  loading: boolean;
  errorType: PageErrorType | undefined;
  handleRetry: () => void;
}

export function useAiCopywriting(): UseAiCopywritingReturn {
  const [copy, setCopy] = useState<AiCopywriting | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType | undefined>(
    undefined,
  );
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorType(undefined);

    async function load(): Promise<void> {
      try {
        const response = await fetchAiCopywriting();
        if (cancelled) return;

        const mappedError = getPageErrorType(response);
        if (mappedError) {
          setErrorType(mappedError);
          setCopy(null);
        } else {
          setCopy(response.data ?? null);
        }
      } catch {
        if (cancelled) return;
        setErrorType(PageErrorType.NETWORK);
        setCopy(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const handleRetry = (): void => {
    setFetchKey((k) => k + 1);
  };

  return { copy, loading, errorType, handleRetry };
}
