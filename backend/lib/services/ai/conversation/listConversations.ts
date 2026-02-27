import { eq, desc, count } from 'drizzle-orm';

import type { ConversationListItem } from './types.js';
import { db, aiConversations, aiMessages } from '../../../../db/index.js';

export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const rows = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));

  const counts = await Promise.all(
    rows.map((c) =>
      db
        .select({ total: count() })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, c.id))
        .then(([r]) => ({ id: c.id, total: r?.total ?? 0 })),
    ),
  );

  const countMap = new Map(counts.map((c) => [c.id, c.total]));

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    updated_at: c.updatedAt.toISOString(),
    message_count: countMap.get(c.id) ?? 0,
  }));
}
