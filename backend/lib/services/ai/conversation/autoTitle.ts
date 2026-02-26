import { eq } from 'drizzle-orm';
import { db, aiConversations } from '@/db';

export async function autoTitle(
  conversationId: string,
  firstUserMessage: string,
): Promise<void> {
  const title =
    firstUserMessage.length > 20
      ? firstUserMessage.slice(0, 20) + '...'
      : firstUserMessage;

  await db
    .update(aiConversations)
    .set({ title })
    .where(eq(aiConversations.id, conversationId));
}
