import { NextResponse } from 'next/server';
import { getProfilePageData } from '@/lib/services/profile';

/**
 * POST /piko/profile/detail/v1
 * Returns all data needed to render the Profile page.
 *
 * Body: { session?: string }
 */
export async function POST(request: Request) {
  try {
    const { session } = (await request.json()) as { session?: string };
    const data = await getProfilePageData(session || undefined);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile';
    console.error('profile/detail error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
