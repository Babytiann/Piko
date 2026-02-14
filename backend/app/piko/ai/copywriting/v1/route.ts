import { NextResponse } from 'next/server';
import type { AiCopywriting } from '@/types/ai';

/**
 * POST /piko/ai/copywriting/v1
 * Returns all user-facing text for the AI chat page.
 *
 * Body: {} (no params required)
 */
export async function POST() {
  try {
    const data: AiCopywriting = {
      headerTitle: 'AI 助手',
      emptyTitle: 'Hi，我是 Piko AI',
      emptySubtitle: '问我任何问题，我会尽力帮你解答。',
      inputPlaceholder: '问我任何问题...',
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load copywriting';
    console.error('ai/copywriting error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
