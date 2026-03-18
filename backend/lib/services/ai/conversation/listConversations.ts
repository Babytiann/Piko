import { eq, desc, sql } from 'drizzle-orm';

import type { ConversationListItem } from './types.js';
import { db, aiConversations } from '../../../../db/index.js';

export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const rows = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      updatedAt: aiConversations.updatedAt,
      messageCount:
        sql<number>`(SELECT COUNT(*) FROM ai_message WHERE conversation_id = ${aiConversations.id})`.as(
          'message_count',
        ),
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    updated_at: c.updatedAt.toISOString(),
    message_count: Number(c.messageCount) || 0,
  }));
}
