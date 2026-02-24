import type { ProfilePageData } from '@/types/profile';
import { getUserInfo } from './telegram';
import { getProfilePhoto } from './telegram/photo';
import { getUserWithBinding, getTelegramSession, unbindTelegram } from './user';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

function getAvatarColor(id: string): string {
  const index = Math.abs(parseInt(id, 10) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ---------------------------------------------------------------------------
// Page data builders
// ---------------------------------------------------------------------------

function buildUnboundPageData(nickname?: string): ProfilePageData {
  return {
    header: { title: '个人中心' },
    telegramSection: {
      title: 'Telegram 账号',
      isLoggedIn: false,
      bindPrompt: '绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。',
      bindButtonText: '绑定 Telegram 账号',
    },
    ...(nickname && { user: { nickname } }),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregate all data needed by the Profile page.
 *
 * 优先从 DB 查询 TG 绑定的 sessionString；
 * 若 DB 无记录则 fallback 到前端传入的 session（向后兼容）。
 */
export async function getProfilePageData(
  userId: string,
  fallbackSession?: string,
): Promise<ProfilePageData> {
  const dbUser = await getUserWithBinding(userId);
  const nickname = dbUser?.nickname ?? undefined;

  // 尝试从 DB 拿 session，兜底用前端传入的
  const session =
    dbUser?.telegramBinding?.sessionString ?? fallbackSession ?? null;

  if (!session) return buildUnboundPageData(nickname);

  try {
    // 两次调用复用同一个 GramJS client 实例，必须串行，防止并发导致 libuv handle 错乱。
    // 有缓存时两步都是内存命中，实际耗时可忽略不计。
    const userInfo = await getUserInfo(session);
    const photoResult = userInfo.hasPhoto
      ? await getProfilePhoto(session)
      : null;

    const img_url = photoResult?.buffer
      ? `data:image/jpeg;base64,${photoResult.buffer.toString('base64')}`
      : undefined;

    const displayName =
      [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ') ||
      '未知用户';

    return {
      header: { title: '个人中心' },
      telegramSection: {
        title: 'Telegram 账号',
        isLoggedIn: true,
        user: {
          displayName,
          username: userInfo.username ? `@${userInfo.username}` : '',
          phone: userInfo.phone,
          img_url,
          avatarText: (userInfo.firstName || userInfo.username || '?')
            .charAt(0)
            .toUpperCase(),
          avatarColor: getAvatarColor(userInfo.id),
        },
        unbindButtonText: '解除绑定',
      },
      ...(nickname && { user: { nickname } }),
    };
  } catch (err: unknown) {
    // TG session 失效时自动清理 DB 绑定
    if (err instanceof Error && err.message.includes('AUTH_KEY_UNREGISTERED')) {
      await unbindTelegram(userId).catch(() => {});
    }
    throw err;
  }
}
