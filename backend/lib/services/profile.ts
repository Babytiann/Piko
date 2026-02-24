import type { ProfilePageCopy, ProfilePageData } from '@/types/profile';
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

const PROFILE_COPY: ProfilePageCopy = {
  pageTitle: '个人主页',
  userSection: {
    appleLoginLabel: '通过 Apple 登录',
    signInPrompt: '使用 Apple 账号登录后可使用 AI 聊天等功能。',
    iosOnlyHint: '请在 iOS 设备上使用 Apple 登录。',
    loadingLabel: '加载中…',
  },
  linkedAccount: {
    title: '关联账号',
    boundLabel: '已绑定',
    boundHint: '点击管理绑定设置',
    unboundHint: '点击绑定',
    loginFirstHint: '登录后可在此绑定 Telegram 账号。',
  },
  settings: {
    title: '设置',
    items: [
      { title: '通知设置', description: '管理推送和消息通知' },
      { title: '隐私与安全', description: '账号安全和数据隐私' },
      { title: '账号设置', description: '管理个人信息和偏好' },
    ],
  },
  help: {
    title: '帮助与支持',
    items: [
      { title: '帮助中心', description: '常见问题和使用指南' },
      { title: '联系我们', description: '反馈问题或建议' },
    ],
  },
  logoutButton: '退出登录',
  logoutIngress: '退出中…',
  footer: {
    versionLabel: 'Ver',
    uidLabel: 'UID',
    didLabel: 'DID',
  },
};

function buildUnboundPageData(): ProfilePageData {
  return {
    header: { title: PROFILE_COPY.pageTitle },
    copy: PROFILE_COPY,
    telegramSection: {
      title: 'Telegram 账号',
      isLoggedIn: false,
      bindPrompt: '绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。',
      bindButtonText: '绑定 Telegram 账号',
    },
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

  // 尝试从 DB 拿 session，兜底用前端传入的
  const session =
    dbUser?.telegramBinding?.sessionString ?? fallbackSession ?? null;

  if (!session) return buildUnboundPageData();

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

    const boundAt = dbUser?.telegramBinding?.createdAt;
    return {
      header: { title: PROFILE_COPY.pageTitle },
      copy: PROFILE_COPY,
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
          telegramUserId: userInfo.id,
          boundAt: boundAt ? boundAt.toISOString() : undefined,
        },
        unbindButtonText: '解除绑定',
      },
    };
  } catch (err: unknown) {
    // TG session 失效时自动清理 DB 绑定
    if (err instanceof Error && err.message.includes('AUTH_KEY_UNREGISTERED')) {
      await unbindTelegram(userId).catch(() => {});
    }
    throw err;
  }
}
