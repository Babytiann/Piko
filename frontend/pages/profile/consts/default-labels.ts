import type { ProfilePageLabels } from '@/common/typings/profile';

/** Fallback labels when API data is not yet available (e.g. before login). */
export const DEFAULT_PROFILE_LABELS: ProfilePageLabels = {
  page_title: '个人主页',
  user_section: {
    apple_login_label: '通过 Apple 登录',
    google_login_label: '使用 Google 登录',
    sign_in_prompt: '请选择登录方式，登录后可使用 AI 聊天、预算管理等功能。',
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
  alert_auth_expired_title: '登录已失效',
  alert_auth_expired_desc: 'Telegram 登录已失效，请重新绑定账号。',
  alert_auth_expired_ok: '确定',
  alert_logout_title: '确认退出',
  alert_logout_desc: '确定要退出登录吗？',
  alert_logout_cancel: '取消',
  alert_logout_ok: '确定',
};
