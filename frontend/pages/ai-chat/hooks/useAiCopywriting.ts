import { useEffect, useState } from 'react';
import { fetchAiCopywriting } from '@/services/ai';
import type { AiCopywriting } from '../types';

interface UseAiCopywritingReturn {
  copy: AiCopywriting | null;
  loading: boolean;
}

export function useAiCopywriting(): UseAiCopywritingReturn {
  const [copy, setCopy] = useState<AiCopywriting | null>(null);
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
