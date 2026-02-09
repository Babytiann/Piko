import { NextResponse } from 'next/server';
import { getChatListPageData } from '@/lib/services/chat';

/**
 * POST /piko/chat/list/v1
 * Returns all data needed to render the Chat list (messages tab) page.
 *
 * Body: { session?: string }
 */
export async function POST(request: Request) {
  try {
    const { session } = (await request.json()) as { session?: string };
    const data = await getChatListPageData(session || undefined);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load chat list';
    console.error('chat/list error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
