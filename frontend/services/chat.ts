import type { ChatListPageData, ChatDetailPageData } from '@/types/chat';
import { post } from './api-client';

/** Fetch all data for the Chat list (messages tab) page. */
export function fetchChatListPage(session?: string): Promise<ChatListPageData> {
  return post<ChatListPageData>('chat/list/v1', { session });
}

/** Fetch all data for a single Chat detail page. */
export function fetchChatDetailPage(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  title: string,
  offsetId?: number,
): Promise<ChatDetailPageData> {
  return post<ChatDetailPageData>('chat/detail/v1', {
    session,
    chatId,
    chatType,
    accessHash,
    title,
    offsetId,
  });
}
