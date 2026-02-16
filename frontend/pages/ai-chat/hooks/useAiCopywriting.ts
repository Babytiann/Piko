import { useEffect, useState } from 'react';
import { fetchAiCopywriting } from '@/services/ai';
import type { AiCopywriting } from '../types';

/** Default (fallback) copywriting used until the API responds. */
const DEFAULT_COPY: AiCopywriting = {
  headerTitle: 'AI 助手',
  emptyTitle: 'Hi，我是 Piko AI',
  emptySubtitle: '问我任何问题，我会尽力帮你解答。',
  inputPlaceholder: '问我任何问题...',
};

interface UseAiCopywritingReturn {
  copy: AiCopywriting;
  loading: boolean;
}

export function useAiCopywriting(): UseAiCopywritingReturn {
  const [copy, setCopy] = useState<AiCopywriting>(DEFAULT_COPY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await fetchAiCopywriting();
      if (!cancelled) {
        setCopy(data);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { copy, loading };
}
