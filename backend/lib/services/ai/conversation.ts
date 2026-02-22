import { eq, and, desc, asc, count } from 'drizzle-orm';
import { db, aiConversations, aiMessages } from '@/db';
import { createId } from '@paralleldrive/cuid2';

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

/** 判断是否为唯一约束冲突（幂等入库时使用） */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505' // PostgreSQL unique violation
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: 'user' | 'model';
    content: string;
    toolCalls: unknown;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * 创建新对话。
 */
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

/**
 * 获取用户对话列表（按最近更新排序）。
 */
export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  // 子查询获取每个对话的消息数
  const rows = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));

  // 批量查各对话消息数
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
    updatedAt: c.updatedAt.toISOString(),
    messageCount: countMap.get(c.id) ?? 0,
  }));
}

/**
 * 获取对话详情（含所有消息）。
 */
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
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as 'user' | 'model',
      content: m.content,
      toolCalls: m.toolCalls,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

/**
 * 删除对话（级联删除消息由 FK 自动处理）。
 */
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

/**
 * 仅保存用户消息（支持幂等入库）。
 */
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
    // 幂等：已存在则跳过
  }

  // 更新对话的 updatedAt
  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId));
}

/**
 * 仅保存模型消息（支持幂等入库）。
 */
export async function saveModelMessage(
  conversationId: string,
  modelContent: string,
  toolCalls?: unknown,
  messageId?: string,
): Promise<void> {
  try {
    await db.insert(aiMessages).values({
      id: messageId ?? createId(),
      conversationId,
      role: 'MODEL',
      content: modelContent,
      toolCalls: toolCalls ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // 幂等：已存在则跳过
  }

  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId));
}

/**
 * 用首条用户消息自动生成对话标题（截取前 20 字）。
 */
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
