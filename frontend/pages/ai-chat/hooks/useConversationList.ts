import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchConversationList,
  deleteConversation as deleteConversationApi,
} from '@/services/ai';
import type { ConversationItem } from '../types';

interface UseConversationListReturn {
  conversations: ConversationItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => void;
}

const CONVERSATION_CACHE_KEY = 'ai:conversation:list:v1';

async function saveConversationCache(list: ConversationItem[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSATION_CACHE_KEY, JSON.stringify(list));
}

async function loadConversationCache(): Promise<ConversationItem[]> {
  const raw = await AsyncStorage.getItem(CONVERSATION_CACHE_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item): item is ConversationItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.updatedAt === 'string' &&
      typeof candidate.messageCount === 'number'
    );
  });
}

export function useConversationList(
  userId: string | null,
): UseConversationListReturn {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      void AsyncStorage.removeItem(CONVERSATION_CACHE_KEY).catch((err) => {
        console.error('[ConversationList] clear cache error:', err);
      });
      return;
    }

    const bootstrap = async (): Promise<void> => {
      try {
        const cached = await loadConversationCache();
        if (cached.length > 0) {
          setConversations(cached);
        }
      } catch (err) {
        console.error('[ConversationList] load cache error:', err);
      }
    };

    void bootstrap();
  }, [userId]);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const list = await fetchConversationList();
      setConversations(list);
      await saveConversationCache(list);
    } catch (err) {
      console.error('[ConversationList] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(
    (id: string): void => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        void saveConversationCache(next).catch((err) => {
          console.error(
            '[ConversationList] save cache after delete error:',
            err,
          );
        });
        return next;
      });

      void deleteConversationApi(id).catch((err) => {
        console.error('[ConversationList] delete error:', err);
        void refresh();
      });
    },
    [refresh],
  );

  return { conversations, isLoading, refresh, remove };
}
