import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// User Service — 用户管理
// ---------------------------------------------------------------------------

/**
 * 确保用户存在。若不存在则自动创建。
 * 用于 Mock Auth 阶段 — getUserId 返回的 ID 可能不在 DB 中。
 */
export async function ensureUser(userId: string) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      nickname: '新用户',
    },
  });
}

/**
 * 更新用户资料（昵称、头像）。
 */
export async function updateUserProfile(
  userId: string,
  data: { nickname?: string; avatarUrl?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  });
}

/**
 * 获取用户信息（含 Telegram 绑定状态）。
 */
export async function getUserWithBinding(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { telegramBinding: true },
  });
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
) {
  return prisma.telegramBinding.upsert({
    where: { userId },
    update: {
      telegramUserId: data.telegramUserId,
      username: data.username,
      firstName: data.firstName,
      phone: data.phone,
      sessionString: data.sessionString,
    },
    create: {
      userId,
      telegramUserId: data.telegramUserId,
      username: data.username,
      firstName: data.firstName,
      phone: data.phone,
      sessionString: data.sessionString,
    },
  });
}

/**
 * 解除 Telegram 绑定。
 */
export async function unbindTelegram(userId: string): Promise<boolean> {
  const binding = await prisma.telegramBinding.findUnique({
    where: { userId },
  });

  if (!binding) return false;

  await prisma.telegramBinding.delete({ where: { userId } });
  return true;
}

/**
 * 根据 userId 获取 Telegram session string。
 * 用于后端需要调用 TG API 但前端不传 session 的场景。
 */
export async function getTelegramSession(
  userId: string,
): Promise<string | null> {
  const binding = await prisma.telegramBinding.findUnique({
    where: { userId },
  });

  return binding?.sessionString ?? null;
}
