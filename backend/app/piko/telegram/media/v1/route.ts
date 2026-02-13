import { NextResponse } from 'next/server';
import { downloadMessageMedia } from '@/lib/services/telegram';

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
