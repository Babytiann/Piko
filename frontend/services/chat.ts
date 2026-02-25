import type { ApiResponse } from '@/common/typings/api';
import type {
  ChatListPageData,
  ChatDetailPageData,
} from '@/common/typings/chat';
import { fetch } from '@/services';

/** Fetch all data for the Chat list (messages tab) page. */
export function fetchChatListPage(
  session?: string,
): Promise<ApiResponse<ChatListPageData>> {
  return fetch<{ session?: string }, ChatListPageData>({
    method: 'POST',
    path: 'chat/list/v1',
    body: { session },
  });
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
  return fetch<
    {
      session: string;
      chatId: string;
      chatType: string;
      accessHash: string;
      title: string;
      offsetId?: number;
    },
    ChatDetailPageData
  >({
    method: 'POST',
    path: 'chat/detail/v1',
    body: { session, chatId, chatType, accessHash, title, offsetId },
  });
}
