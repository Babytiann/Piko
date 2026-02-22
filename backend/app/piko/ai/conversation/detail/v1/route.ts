import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getConversationWithMessages } from '@/lib/services/ai/conversation';

/**
 * POST /piko/ai/conversation/detail/v1
 *
 * 获取 AI 对话详情（含所有消息）。
 *
 * Body: { conversationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = (await request.json()) as { conversationId: string };

    if (!body.conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 },
      );
    }

    const detail = await getConversationWithMessages(
      userId,
      body.conversationId,
    );

    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get conversation detail';
    console.error('[Conversation detail] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
