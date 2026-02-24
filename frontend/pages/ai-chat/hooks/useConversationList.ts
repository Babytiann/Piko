import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchConversationList,
  deleteConversation as deleteConversationApi,
} from '@/services/ai';
import type { ConversationItem } from '../types';

const PAGE_SIZE = 20;

interface UseConversationListReturn {
  conversations: ConversationItem[];
  visibleConversations: ConversationItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => void;
  loadMore: () => void;
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const pendingDeleteIds = useRef(new Set<string>());
  const hasFetchedForUser = useRef(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!userId) {
      hasFetchedForUser.current = false;
      setConversations([]);
      setVisibleCount(PAGE_SIZE);
      pendingDeleteIds.current.clear();
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

    void bootstrap().then(() => {
      if (hasFetchedForUser.current) return;
      hasFetchedForUser.current = true;
      void refreshRef.current?.();
    });
  }, [userId]);

  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const list = await fetchConversationList();
      const filtered = list.filter((c) => !pendingDeleteIds.current.has(c.id));
      setConversations(filtered);
      setVisibleCount(PAGE_SIZE);
      await saveConversationCache(filtered);
    } catch (err) {
      console.error('[ConversationList] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  refreshRef.current = refresh;

  const remove = (id: string): void => {
    pendingDeleteIds.current.add(id);

    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      void saveConversationCache(next).catch((err) => {
        console.error('[ConversationList] save cache after delete error:', err);
      });
      return next;
    });

    void deleteConversationApi(id)
      .then(() => {
        pendingDeleteIds.current.delete(id);
      })
      .catch((err) => {
        console.error('[ConversationList] delete error:', err);
        pendingDeleteIds.current.delete(id);
        void refreshRef.current?.();
      });
  };

  const loadMore = (): void => {
    setVisibleCount((prev) =>
      prev >= conversations.length ? prev : prev + PAGE_SIZE,
    );
  };

  const visibleConversations = conversations.slice(0, visibleCount);

  return {
    conversations,
    visibleConversations,
    isLoading,
    refresh,
    remove,
    loadMore,
  };
}
