/** Data contract for the Profile page. */

export interface ProfileUser {
  display_name: string;
  username: string;
  phone: string;
  /** Base64 data URI of the user's profile photo. */
  img_url?: string;
  avatar_text: string;
  avatar_color: string;
  /** Telegram 用户 ID（仅已绑定时有）. */
  telegram_user_id?: string;
  /** 绑定时间 ISO 字符串（仅已绑定时有）. */
  bound_at?: string;
}

export interface TelegramSection {
  title: string;
  is_logged_in: boolean;
  user?: ProfileUser;
  unbind_button_text?: string;
  bind_prompt?: string;
  bind_button_text?: string;
}

/** Label item for settings/help list rows. */
export interface ProfileLabelItem {
  title: string;
  description: string;
}

/** Apple / Better Auth 用户信息，由 profile 接口统一返回，供首屏 Apple 区块使用。 */
export interface ProfileAppUser {
  id: string;
  name: string | null;
  email: string | null;
  /** 用户自定义昵称（来自 DB），未设置时为 null。 */
  nickname?: string | null;
  /** 自定义头像 URL（R2），未设置时为 null。 */
  avatar_url?: string | null;
  /** 天气城市（为空则用自动定位或默认），未设置时为 null。 */
  weather_city?: string | null;
}

/** All profile page labels (backend-driven). */
export interface ProfilePageLabels {
  page_title: string;
  user_section: {
    apple_login_label: string;
    sign_in_prompt: string;
    ios_only_hint: string;
    loading_label: string;
  };
  linked_account: {
    title: string;
    bound_label: string;
    bound_hint: string;
    unbound_hint: string;
    login_first_hint: string;
  };
  settings: {
    title: string;
    items: ProfileLabelItem[];
  };
  help: {
    title: string;
    items: ProfileLabelItem[];
  };
  logout_button: string;
  logout_ingress: string;
  alert_auth_expired_title: string;
  alert_auth_expired_desc: string;
  alert_auth_expired_ok: string;
  alert_logout_title: string;
  alert_logout_desc: string;
  alert_logout_cancel: string;
  alert_logout_ok: string;
}

export interface ProfilePageData {
  header: { title: string };
  /** 当前 Apple 登录用户，未登录为 null。首屏 Apple 区块据此渲染。 */
  app_user: ProfileAppUser | null;
  labels: ProfilePageLabels;
  telegram_section: TelegramSection;
}
