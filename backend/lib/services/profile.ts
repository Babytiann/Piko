import type {
  ProfilePageCopy,
  ProfilePageData,
  ProfileAppUser,
} from '@/types/profile';
import { getUserWithBinding } from './user';

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
};

function buildUnboundPageData(appUser: ProfileAppUser | null): ProfilePageData {
  return {
    header: { title: PROFILE_COPY.pageTitle },
    appUser,
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
 * 首屏单接口：同时返回 appUser（Apple 登录态）、copy、telegramSection。
 *
 * @param appUser 当前 Better Auth 用户，未登录为 null
 * @param _fallbackSession 前端传入的 Telegram session（保留兼容，已绑定状态仅以 DB 为准）
 */
export async function getProfilePageData(
  appUser: ProfileAppUser | null,
  _fallbackSession?: string,
): Promise<ProfilePageData> {
  const userId = appUser?.id ?? null;
  if (!userId) return buildUnboundPageData(null);

  const dbUser = await getUserWithBinding(userId);
  const binding = dbUser?.telegramBinding ?? null;

  if (!binding) return buildUnboundPageData(appUser);

  // 已绑定状态仅由 DB 决定，用 DB 已有字段立即返回，不请求 Telegram API
  const displayName =
    [binding.firstName, binding.username].filter(Boolean).join(' ') ||
    '未知用户';
  const avatarText = (binding.firstName || binding.username || '?')
    .charAt(0)
    .toUpperCase();

  return {
    header: { title: PROFILE_COPY.pageTitle },
    appUser,
    copy: PROFILE_COPY,
    telegramSection: {
      title: 'Telegram 账号',
      isLoggedIn: true,
      user: {
        displayName,
        username: binding.username ? `@${binding.username}` : '',
        phone: binding.phone ?? '',
        avatarText,
        avatarColor: getAvatarColor(String(binding.telegramUserId)),
        telegramUserId: String(binding.telegramUserId),
        boundAt: binding.createdAt.toISOString(),
      },
      unbindButtonText: '解除绑定',
    },
  };
}
