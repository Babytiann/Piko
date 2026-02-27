import { eq, and, asc } from 'drizzle-orm';

import type { ConversationDetail } from './types.js';
import { db, aiConversations, aiMessages } from '../../../../db/index.js';

export async function getConversationWithMessages(
  userId: string,
  conversationId: string,
): Promise<ConversationDetail | null> {
  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    )
    .limit(1);

  if (!conversation) return null;

  const messages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt));

  return {
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.createdAt.toISOString(),
    updated_at: conversation.updatedAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as 'user' | 'model',
      content: m.content,
      tool_calls: m.toolCalls,
      created_at: m.createdAt.toISOString(),
    })),
  };
}
