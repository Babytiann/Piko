import { useEffect, useRef } from 'react';

import type { MessageItem } from '@/common/typings/chat';
import { fetchChatDetailPage } from '@/service/chat';

import { CHAT_POLLING_INTERVAL } from '../consts';

interface ChatPollingParams {
  session: string | null;
  chatId: string;
  chatType: string;
  accessHash: string;
  title: string;
}

/**
 * Effect Hook: polls for new messages at a fixed interval and merges them
 * into the existing message list via the provided callback.
 */
export function useChatPolling(
  params: ChatPollingParams,
  onNewMessages: (freshBatch: MessageItem[]) => void,
): void {
  const { session, chatId, chatType, accessHash, title } = params;
  const onNewMessagesRef = useRef(onNewMessages);
  onNewMessagesRef.current = onNewMessages;

  useEffect(() => {
    if (!session || !chatId) return;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetchChatDetailPage(
          session,
          chatId,
          chatType,
          accessHash,
          title,
        );
        if (response.success && response.data) {
          onNewMessagesRef.current(response.data.messages);
        }
      } catch {
        // Polling errors are swallowed to avoid flickering error UI
      }
    };

    const intervalId = setInterval(() => void poll(), CHAT_POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [session, chatId, chatType, accessHash, title]);
}
