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

    const { conversationId } = body;
    console.log(
      `[Conversation delete] accepted (user=${userId}, conversation=${conversationId})`,
    );

    void deleteConversation(userId, conversationId)
      .then((deleted) => {
        console.log(
          `[Conversation delete] done (user=${userId}, conversation=${conversationId}, deleted=${deleted})`,
        );
      })
      .catch((error: unknown) => {
        console.error(
          `[Conversation delete] async error (user=${userId}, conversation=${conversationId}):`,
          error,
        );
      });

    return NextResponse.json({ success: true, data: { accepted: true } });
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
