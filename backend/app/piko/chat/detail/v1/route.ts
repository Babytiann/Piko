import { NextResponse } from 'next/server';
import { getChatDetailPageData } from '@/lib/services/chat';

/**
 * POST /piko/chat/detail/v1
 * Returns all data needed to render a single Chat detail page.
 *
 * Body: { session: string, chatId: string, chatType: string, accessHash: string, title: string, offsetId?: number }
 */
export async function POST(request: Request) {
  try {
    const { session, chatId, chatType, accessHash, title, offsetId } =
      (await request.json()) as {
        session: string;
        chatId: string;
        chatType: string;
        accessHash: string;
        title: string;
        offsetId?: number;
      };

    if (!session || !chatId) {
      return NextResponse.json(
        { success: false, error: 'session and chatId are required' },
        { status: 400 },
      );
    }

    const data = await getChatDetailPageData(
      session,
      chatId,
      chatType ?? 'user',
      accessHash ?? '',
      title ?? 'Chat',
      50,
      offsetId,
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load chat detail';
    console.error('chat/detail error:', error);

    if (message.includes('AUTH_KEY_UNREGISTERED')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          errorCode: 'AUTH_EXPIRED',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
