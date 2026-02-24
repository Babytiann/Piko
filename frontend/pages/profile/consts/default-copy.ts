import type { ProfilePageCopy } from '@/common/typings/profile';

/** Fallback copy when API data is not yet available (e.g. before login). */
export const DEFAULT_PROFILE_COPY: ProfilePageCopy = {
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
