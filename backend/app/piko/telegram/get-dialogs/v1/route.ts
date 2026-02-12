import { NextResponse } from 'next/server';
import { Api } from 'telegram';
import { getPooledClient } from '@/lib/telegram';

/**
 * POST /piko/telegram/get-dialogs/v1
 * Get the list of dialogs (chats) for the authenticated user.
 *
 * Body: { session: string, limit?: number, offsetDate?: number }
 * Returns: { success: true, dialogs: Array<Dialog> }
 */
export async function POST(request: Request) {
  try {
    const {
      session,
      limit = 30,
      offsetDate,
    } = (await request.json()) as {
      session: string;
      limit?: number;
      offsetDate?: number;
    };

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'session is required' },
        { status: 400 },
      );
    }

    const client = await getPooledClient(session);

    const dialogs = await client.getDialogs({
      limit,
      offsetDate,
    });

    const formattedDialogs = dialogs.map((dialog) => {
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
      const msg = dialog.message;
      if (msg) {
        lastMessage = msg.message ?? '';
        lastMessageDate = msg.date ?? null;
      }

      return {
        id: dialog.id?.toString(),
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

    return NextResponse.json({
      success: true,
      dialogs: formattedDialogs,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get dialogs';
    console.error('get-dialogs error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
