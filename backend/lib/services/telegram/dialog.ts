import { Api } from 'telegram';

import { getPooledClient } from '@/lib/telegram';
import type { RawDialog } from '@/types/telegram';

export async function getDialogList(
  session: string,
  limit = 30,
  offsetDate?: number,
): Promise<RawDialog[]> {
  const client = await getPooledClient(session);
  const dialogs = await client.getDialogs({ limit, offsetDate });

  return dialogs.map((dialog) => {
    const entity = dialog.entity;
    let title = dialog.title ?? 'Unknown';
    let type: 'user' | 'group' | 'channel' = 'user';
    let username = '';
    let accessHash = '';

    if (entity instanceof Api.User) {
      title =
        [entity.firstName, entity.lastName].filter(Boolean).join(' ') ||
        'Unknown';
      username = entity.username ?? '';
      type = 'user';
      accessHash = entity.accessHash?.toString() ?? '';
    } else if (entity instanceof Api.Chat) {
      title = entity.title;
      type = 'group';
    } else if (entity instanceof Api.Channel) {
      title = entity.title;
      username = entity.username ?? '';
      type = entity.megagroup ? 'group' : 'channel';
      accessHash = entity.accessHash?.toString() ?? '';
    }

    let lastMessage = '';
    let lastMessageDate: number | null = null;
    if (dialog.message) {
      lastMessage = dialog.message.message ?? '';
      if (!lastMessage && dialog.message.media) {
        const mediaName = dialog.message.media.className;
        if (mediaName === 'MessageMediaPhoto') lastMessage = '[图片]';
        else if (mediaName === 'MessageMediaDocument') lastMessage = '[文件]';
        else lastMessage = '[媒体]';
      }
      lastMessageDate = dialog.message.date ?? null;
    }

    return {
      id: dialog.id?.toString() ?? '',
      title,
      type,
      username,
      accessHash,
      unreadCount: dialog.unreadCount,
      lastMessage,
      lastMessageDate,
      pinned: dialog.pinned,
    };
  });
}
