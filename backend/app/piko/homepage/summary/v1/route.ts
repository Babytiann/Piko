import { NextResponse } from 'next/server';
import { getHomePageData } from '@/lib/services/home';

/**
 * POST /piko/homepage/summary/v1
 * Returns all data needed to render the Home page.
 *
 * Body: {} (no params required for now)
 */
export async function POST() {
  try {
    const data = await getHomePageData();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load homepage';
    console.error('homepage/summary error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
