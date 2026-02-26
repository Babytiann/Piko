import type {
  ProfilePageCopy,
  ProfilePageData,
  ProfileAppUser,
} from '../../../types/profile.js';
import { getUserWithBinding } from '../user/index.js';

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

const PROFILE_COPY: ProfilePageCopy = {
  page_title: '个人主页',
  user_section: {
    apple_login_label: '通过 Apple 登录',
    sign_in_prompt: '使用 Apple 账号登录后可使用 AI 聊天等功能。',
    ios_only_hint: '请在 iOS 设备上使用 Apple 登录。',
    loading_label: '加载中…',
  },
  linked_account: {
    title: '关联账号',
    bound_label: '已绑定',
    bound_hint: '点击管理绑定设置',
    unbound_hint: '点击绑定',
    login_first_hint: '登录后可在此绑定 Telegram 账号。',
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
  logout_button: '退出登录',
  logout_ingress: '退出中…',
};

function buildUnboundPageData(appUser: ProfileAppUser | null): ProfilePageData {
  return {
    header: { title: PROFILE_COPY.page_title },
    app_user: appUser,
    copy: PROFILE_COPY,
    telegram_section: {
      title: 'Telegram 账号',
      is_logged_in: false,
      bind_prompt: '绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。',
      bind_button_text: '绑定 Telegram 账号',
    },
  };
}

export async function getProfilePageData(
  appUser: ProfileAppUser | null,
  _fallbackSession?: string,
): Promise<ProfilePageData> {
  const userId = appUser?.id ?? null;
  if (!userId) return buildUnboundPageData(null);

  const dbUser = await getUserWithBinding(userId);
  const binding = dbUser?.telegramBinding ?? null;

  if (!binding) return buildUnboundPageData(appUser);

  const displayName =
    [binding.firstName, binding.username].filter(Boolean).join(' ') ||
    '未知用户';
  const avatarText = (binding.firstName || binding.username || '?')
    .charAt(0)
    .toUpperCase();

  return {
    header: { title: PROFILE_COPY.page_title },
    app_user: appUser,
    copy: PROFILE_COPY,
    telegram_section: {
      title: 'Telegram 账号',
      is_logged_in: true,
      user: {
        display_name: displayName,
        username: binding.username ? `@${binding.username}` : '',
        phone: binding.phone ?? '',
        avatar_text: avatarText,
        avatar_color: getAvatarColor(String(binding.telegramUserId)),
        telegram_user_id: String(binding.telegramUserId),
        bound_at: binding.createdAt.toISOString(),
      },
      unbind_button_text: '解除绑定',
    },
  };
}
