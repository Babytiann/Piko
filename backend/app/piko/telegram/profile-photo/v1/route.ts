import { NextResponse } from 'next/server';
import { getProfilePhoto } from '@/lib/services/telegram';

/**
 * GET /piko/telegram/profile-photo/v1?session=<session>
 * Returns the user's Telegram profile photo as image/jpeg.
 * Supports HTTP caching via Cache-Control.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get('session');

  if (!session) {
    return NextResponse.json(
      { error: 'session query parameter is required' },
      { status: 400 },
    );
  }

  try {
    const { buffer, hasPhoto } = await getProfilePhoto(session);

    if (!hasPhoto || !buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'no photo' }, { status: 404 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch photo';
    console.error('profile-photo error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
