import { db, aiConversations } from '@/db';
import { createId } from '@paralleldrive/cuid2';

export async function createConversation(
  userId: string,
  title?: string,
): Promise<{ id: string; title: string; createdAt: Date }> {
  const id = createId();
  const resolvedTitle = title ?? '新对话';
  const createdAt = new Date();
  await db.insert(aiConversations).values({
    id,
    userId,
    title: resolvedTitle,
    createdAt,
    updatedAt: createdAt,
  });
  return { id, title: resolvedTitle, createdAt };
}
