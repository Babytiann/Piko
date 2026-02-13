import type { ApiResponse } from '@/common/typings/api';
import type {
  ChatListPageData,
  ChatDetailPageData,
} from '@/common/typings/chat';
import { postSafe } from '@/common/services/api-client';

/** Fetch all data for the Chat list (messages tab) page. */
export function fetchChatListPage(
  session?: string,
): Promise<ApiResponse<ChatListPageData>> {
  return postSafe<ChatListPageData>('chat/list/v1', { session });
}

/** Fetch all data for a single Chat detail page. */
export function fetchChatDetailPage(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  title: string,
  offsetId?: number,
): Promise<ApiResponse<ChatDetailPageData>> {
  return postSafe<ChatDetailPageData>('chat/detail/v1', {
    session,
    chatId,
    chatType,
    accessHash,
    title,
    offsetId,
  });
}
