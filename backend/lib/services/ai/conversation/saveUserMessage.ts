import { eq } from 'drizzle-orm';
import { db, aiConversations, aiMessages } from '@/db';
import { createId } from '@paralleldrive/cuid2';
import { isUniqueViolation } from './helpers';

export async function saveUserMessage(
  conversationId: string,
  userContent: string,
  messageId?: string,
): Promise<void> {
  try {
    await db.insert(aiMessages).values({
      id: messageId ?? createId(),
      conversationId,
      role: 'USER',
      content: userContent,
      createdAt: new Date(),
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId));
}
