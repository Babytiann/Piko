import { NextResponse } from 'next/server';
import { downloadPeerPhoto } from '@/lib/services/telegram';

/**
 * GET /piko/telegram/avatar/v1?session=...&peerId=...&peerType=...&accessHash=...
 *
 * Generic avatar proxy — downloads the profile photo for any user, group, or
 * channel and returns it as image/jpeg with aggressive caching headers.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get('session');
  const peerId = searchParams.get('peerId');
  const peerType = searchParams.get('peerType') ?? 'user';
  const accessHash = searchParams.get('accessHash') ?? '';

  if (!session || !peerId) {
    return NextResponse.json(
      { error: 'session and peerId are required' },
      { status: 400 },
    );
  }

  try {
    const buffer = await downloadPeerPhoto(
      session,
      peerId,
      peerType,
      accessHash,
    );

    if (!buffer) {
      return NextResponse.json({ error: 'no photo' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch avatar';
    console.error('avatar error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
