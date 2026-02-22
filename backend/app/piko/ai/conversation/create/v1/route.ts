import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { createConversation } from '@/lib/services/ai/conversation';

/**
 * POST /piko/ai/conversation/create/v1
 *
 * 创建新 AI 对话。
 *
 * Body: { title?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = (await request.json()) as { title?: string };

    const conversation = await createConversation(userId, body.title);

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create conversation';
    console.error('[Conversation create] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
