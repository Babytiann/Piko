/** Data contract for the Profile page (mirrors backend). */

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

/** Copy for settings/help list rows. */
export interface ProfileCopyItem {
  title: string;
  description: string;
}

/** Apple / Better Auth 用户信息，由 profile 接口统一返回。 */
export interface ProfileAppUser {
  id: string;
  name: string | null;
  email: string | null;
}

/** All profile page copy (backend-driven). */
export interface ProfilePageCopy {
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
    items: ProfileCopyItem[];
  };
  help: {
    title: string;
    items: ProfileCopyItem[];
  };
  logout_button: string;
  logout_ingress: string;
}

export interface ProfilePageData {
  header: { title: string };
  /** 当前 Apple 登录用户，未登录为 null。首屏 Apple 区块据此渲染。 */
  app_user: ProfileAppUser | null;
  copy: ProfilePageCopy;
  telegram_section: TelegramSection;
}
