import { prisma } from '@/lib/prisma';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
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
export async function createConversation(userId: string, title?: string) {
  return prisma.aiConversation.create({
    data: {
      userId,
      title: title ?? '新对话',
    },
  });
}

/**
 * 获取用户对话列表（按最近更新排序）。
 */
export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const conversations = await prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((c: (typeof conversations)[number]) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c._count.messages,
  }));
}

/**
 * 获取对话详情（含所有消息）。
 */
export async function getConversationWithMessages(
  userId: string,
  conversationId: string,
): Promise<ConversationDetail | null> {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map(
      (m: (typeof conversation.messages)[number]) => ({
        id: m.id,
        role: m.role.toLowerCase() as 'user' | 'model',
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  };
}

/**
 * 删除对话（级联删除消息）。
 */
export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) return false;

  await prisma.aiConversation.delete({ where: { id: conversationId } });
  return true;
}

/**
 * 保存一轮对话消息（user + model）到数据库。
 * 同时更新对话的 updatedAt。
 */
export async function saveMessages(
  conversationId: string,
  userContent: string,
  modelContent: string,
  toolCalls?: unknown,
): Promise<void> {
  await Promise.all([
    prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: userContent,
      },
    }),
    prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'MODEL',
        content: modelContent,
        toolCalls: toolCalls ? (toolCalls as object) : undefined,
      },
    }),
    prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

/**
 * 仅保存用户消息。
 */
export async function saveUserMessage(
  conversationId: string,
  userContent: string,
  messageId?: string,
): Promise<void> {
  try {
    await prisma.aiMessage.create({
      data: {
        ...(messageId ? { id: messageId } : {}),
        conversationId,
        role: 'USER',
        content: userContent,
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

/**
 * 仅保存模型消息。
 */
export async function saveModelMessage(
  conversationId: string,
  modelContent: string,
  toolCalls?: unknown,
  messageId?: string,
): Promise<void> {
  try {
    await prisma.aiMessage.create({
      data: {
        ...(messageId ? { id: messageId } : {}),
        conversationId,
        role: 'MODEL',
        content: modelContent,
        toolCalls: toolCalls ? (toolCalls as object) : undefined,
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
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

  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { title },
  });
}
