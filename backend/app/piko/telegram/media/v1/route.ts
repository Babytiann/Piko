import { NextResponse } from 'next/server';
import { downloadMessageMedia } from '@/lib/services/telegram';

/**
 * GET /piko/telegram/media/v1
 * Proxy endpoint that downloads a message's media from Telegram and streams
 * it back to the client as a binary response.
 *
 * Query params:
 *   session     – Telegram session string
 *   chatId      – Numeric chat ID
 *   chatType    – "user" | "group" | "channel"
 *   accessHash  – Access hash for the chat (may be empty for basic groups)
 *   messageId   – ID of the message containing the media
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session');
    const chatId = searchParams.get('chatId');
    const chatType = searchParams.get('chatType') ?? 'user';
    const accessHash = searchParams.get('accessHash') ?? '';
    const messageId = Number(searchParams.get('messageId'));

    if (!session || !chatId || !messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'session, chatId, and messageId are required',
        },
        { status: 400 },
      );
    }

    const result = await downloadMessageMedia(
      session,
      chatId,
      chatType,
      accessHash,
      messageId,
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Media not found or not downloadable' },
        { status: 404 },
      );
    }

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': result.mimeType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to download media';
    console.error('media download error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
