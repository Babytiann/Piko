import type { ProfilePageData } from '@/types/profile';
import { getUserInfo, getProfilePhotoBase64 } from './telegram';

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

function buildUnboundPageData(): ProfilePageData {
  return {
    header: { title: '个人中心' },
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
 * When `session` is provided, fetches Telegram user details;
 * otherwise returns the "unbound" variant.
 */
export async function getProfilePageData(
  session?: string,
): Promise<ProfilePageData> {
  if (!session) return buildUnboundPageData();

  const userInfo = await getUserInfo(session);
  const img_url = userInfo.hasPhoto
    ? await getProfilePhotoBase64(session)
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
  };
}
