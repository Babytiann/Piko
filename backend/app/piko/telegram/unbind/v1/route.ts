import { NextRequest, NextResponse } from 'next/server';
import { Api } from 'telegram';
import { getPooledClient, removePooledClient } from '@/lib/telegram';
import { getUserId } from '@/lib/auth';
import { unbindTelegram, getTelegramSession } from '@/lib/services/user';

/**
 * POST /piko/telegram/unbind/v1
 *
 * 正式注销 Telegram 会话：先调用 Telegram 的 auth.LogOut 使 session 在
 * Telegram 服务端失效，再从服务端连接池中移除对应客户端，
 * 最后从数据库删除 TelegramBinding 记录。
 *
 * Body: { session?: string }（可选 fallback，优先从 DB 读取）
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    let bodySession: string | undefined;
    try {
      const body = (await request.json()) as { session?: string };
      bodySession = body.session || undefined;
    } catch {
      // body 可能为空
    }

    // 优先从 DB 获取 session，fallback 到 body
    const session = (await getTelegramSession(userId)) ?? bodySession;

    if (session) {
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
    }

    // 从数据库删除绑定记录
    await unbindTelegram(userId);

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
