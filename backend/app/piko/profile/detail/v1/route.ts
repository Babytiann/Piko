import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getProfilePageData } from '@/lib/services/profile';

/**
 * POST /piko/profile/detail/v1
 * Returns all data needed to render the Profile page.
 *
 * 不再从 body 读 session，后端通过 userId 从 DB 查询 TG 绑定。
 * Body: {} (可选传 session 做 fallback)
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
    const data = await getProfilePageData(userId, bodySession);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile';
    console.error('profile/detail error:', error);

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
