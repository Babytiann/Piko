import type { ChatListPageData } from '../../../types/chat.js';
import { getDialogList } from '../telegram/index.js';
import { getAvatarColor, formatTime, buildAvatarUrl } from './helpers.js';

export async function getChatListPageData(
  session?: string,
): Promise<ChatListPageData> {
  if (!session) {
    return {
      header: { title: '消息' },
      unbound_state: {
        title: '尚未绑定 Telegram 账号',
        description: '前往「个人中心」绑定你的 Telegram 账号后，即可查看消息。',
        bind_button_text: '前往绑定',
      },
    };
  }

  const rawDialogs = await getDialogList(session, 50);

  return {
    header: { title: '消息' },
    dialogs: rawDialogs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      access_hash: d.access_hash,
      avatar_text: d.title.charAt(0).toUpperCase(),
      avatar_color: getAvatarColor(d.id),
      avatar_url: buildAvatarUrl(session, d.id, d.type, d.access_hash),
      last_message: d.last_message || '...',
      last_message_time: formatTime(d.last_message_date),
      unread_count: d.unread_count,
      pinned: d.pinned,
    })),
  };
}
