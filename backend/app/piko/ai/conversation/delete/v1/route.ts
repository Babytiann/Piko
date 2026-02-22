import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { deleteConversation } from '@/lib/services/ai/conversation';

/**
 * POST /piko/ai/conversation/delete/v1
 *
 * 删除 AI 对话（级联删除所有消息）。
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

    const deleted = await deleteConversation(userId, body.conversationId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete conversation';
    console.error('[Conversation delete] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
