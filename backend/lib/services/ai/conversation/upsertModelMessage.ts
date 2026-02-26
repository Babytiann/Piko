import { eq } from 'drizzle-orm';

import { db, aiConversations, aiMessages } from '../../../../db/index.js';

export async function upsertModelMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<void> {
  const now = new Date();
  await db
    .insert(aiMessages)
    .values({
      id: messageId,
      conversationId,
      role: 'MODEL',
      content,
      toolCalls: null,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: aiMessages.id,
      set: { content },
    });

  await db
    .update(aiConversations)
    .set({ updatedAt: now })
    .where(eq(aiConversations.id, conversationId));
}
