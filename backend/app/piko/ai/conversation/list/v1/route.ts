import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { listConversations } from '@/lib/services/ai/conversation';

/**
 * POST /piko/ai/conversation/list/v1
 *
 * 获取当前用户的 AI 对话列表。
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const conversations = await listConversations(userId);
    return NextResponse.json({ success: true, data: conversations });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to list conversations';
    console.error('[Conversation list] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
