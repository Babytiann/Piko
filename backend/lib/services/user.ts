import { eq } from 'drizzle-orm';
import { db, users, telegramBindings } from '@/db';
import { createId } from '@paralleldrive/cuid2';

// ---------------------------------------------------------------------------
// User Service — 用户管理
// ---------------------------------------------------------------------------

/**
 * 确保用户存在。若不存在则自动创建。
 * 用于 Mock Auth 阶段 — getUserId 返回的 ID 可能不在 DB 中。
 */
export async function ensureUser(userId: string): Promise<void> {
  await db
    .insert(users)
    .values({
      id: userId,
      nickname: '新用户',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: users.id });
}

/**
 * 更新用户资料（昵称、头像）。
 */
export async function updateUserProfile(
  userId: string,
  data: { nickname?: string; avatarUrl?: string },
): Promise<void> {
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

/**
 * 获取用户信息（含 Telegram 绑定状态）。
 */
export async function getUserWithBinding(userId: string): Promise<{
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  telegramBinding: {
    sessionString: string;
    telegramUserId: bigint;
    firstName: string | null;
    username: string | null;
    phone: string | null;
  } | null;
} | null> {
  const [user] = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [binding] = await db
    .select({
      sessionString: telegramBindings.sessionString,
      telegramUserId: telegramBindings.telegramUserId,
      firstName: telegramBindings.firstName,
      username: telegramBindings.username,
      phone: telegramBindings.phone,
    })
    .from(telegramBindings)
    .where(eq(telegramBindings.userId, userId))
    .limit(1);

  return {
    ...user,
    telegramBinding: binding ?? null,
  };
}

/**
 * 绑定 Telegram 账号到用户。
 */
export async function bindTelegram(
  userId: string,
  data: {
    telegramUserId: bigint;
    username?: string;
    firstName?: string;
    phone?: string;
    sessionString: string;
  },
): Promise<void> {
  await db
    .insert(telegramBindings)
    .values({
      id: createId(),
      userId,
      telegramUserId: data.telegramUserId,
      username: data.username ?? null,
      firstName: data.firstName ?? null,
      phone: data.phone ?? null,
      sessionString: data.sessionString,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: telegramBindings.userId,
      set: {
        telegramUserId: data.telegramUserId,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        phone: data.phone ?? null,
        sessionString: data.sessionString,
        updatedAt: new Date(),
      },
    });
}

/**
 * 解除 Telegram 绑定。
 * @returns true 表示删除成功，false 表示记录不存在
 */
export async function unbindTelegram(userId: string): Promise<boolean> {
  const result = await db
    .delete(telegramBindings)
    .where(eq(telegramBindings.userId, userId))
    .returning({ id: telegramBindings.id });

  return result.length > 0;
}

/**
 * 根据 userId 获取 Telegram session string。
 * 用于后端需要调用 TG API 但前端不传 session 的场景。
 */
export async function getTelegramSession(
  userId: string,
): Promise<string | null> {
  const [binding] = await db
    .select({ sessionString: telegramBindings.sessionString })
    .from(telegramBindings)
    .where(eq(telegramBindings.userId, userId))
    .limit(1);

  return binding?.sessionString ?? null;
}
