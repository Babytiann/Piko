import { NextResponse } from 'next/server';
import { Api } from 'telegram';
import { getPooledClient, removePooledClient } from '@/lib/telegram';

/**
 * POST /piko/telegram/unbind/v1
 *
 * 正式注销 Telegram 会话：先调用 Telegram 的 auth.LogOut 使 session 在
 * Telegram 服务端失效，再从服务端连接池中移除对应客户端。
 *
 * Body: { session: string }
 */
export async function POST(request: Request) {
  try {
    const { session } = (await request.json()) as { session?: string };

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'session is required' },
        { status: 400 },
      );
    }

    try {
      const client = await getPooledClient(session);
      await client.invoke(new Api.auth.LogOut());
      await removePooledClient(session);
    } catch (err: unknown) {
      // AUTH_KEY_UNREGISTERED 说明 session 早已失效，无需再注销，视为成功
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('AUTH_KEY_UNREGISTERED')) {
        console.error('telegram unbind warning:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to unbind';
    console.error('telegram unbind error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
