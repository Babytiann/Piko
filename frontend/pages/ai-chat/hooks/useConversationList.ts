import { useState, useCallback } from 'react';

import {
  fetchConversationList,
  deleteConversation as deleteConversationApi,
} from '@/services/ai';
import type { ConversationItem } from '../types';

interface UseConversationListReturn {
  conversations: ConversationItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useConversationList(): UseConversationListReturn {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const list = await fetchConversationList();
      setConversations(list);
    } catch (err) {
      console.error('[ConversationList] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteConversationApi(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('[ConversationList] delete error:', err);
    }
  }, []);

  return { conversations, isLoading, refresh, remove };
}
