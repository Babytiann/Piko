import { eq, and } from 'drizzle-orm';

import { db, aiConversations } from '../../../../db/index.js';

export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const result = await db
    .delete(aiConversations)
    .where(
      and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    )
    .returning({ id: aiConversations.id });

  return result.length > 0;
}
