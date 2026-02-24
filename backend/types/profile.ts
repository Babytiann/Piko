/** Data contract for the Profile page. */

export interface ProfileUser {
  displayName: string;
  username: string;
  phone: string;
  /** Base64 data URI of the user's profile photo. */
  img_url?: string;
  avatarText: string;
  avatarColor: string;
  /** Telegram 用户 ID（仅已绑定时有）. */
  telegramUserId?: string;
  /** 绑定时间 ISO 字符串（仅已绑定时有）. */
  boundAt?: string;
}

export interface TelegramSection {
  title: string;
  isLoggedIn: boolean;
  user?: ProfileUser;
  unbindButtonText?: string;
  bindPrompt?: string;
  bindButtonText?: string;
}

/** Copy for settings/help list rows. */
export interface ProfileCopyItem {
  title: string;
  description: string;
}

/** Apple / Better Auth 用户信息，由 profile 接口统一返回，供首屏 Apple 区块使用。 */
export interface ProfileAppUser {
  id: string;
  name: string | null;
  email: string | null;
}

/** All profile page copy (backend-driven). */
export interface ProfilePageCopy {
  pageTitle: string;
  userSection: {
    appleLoginLabel: string;
    signInPrompt: string;
    iosOnlyHint: string;
    loadingLabel: string;
  };
  linkedAccount: {
    title: string;
    boundLabel: string;
    boundHint: string;
    unboundHint: string;
    loginFirstHint: string;
  };
  settings: {
    title: string;
    items: ProfileCopyItem[];
  };
  help: {
    title: string;
    items: ProfileCopyItem[];
  };
  logoutButton: string;
  logoutIngress: string;
}

export interface ProfilePageData {
  header: { title: string };
  /** 当前 Apple 登录用户，未登录为 null。首屏 Apple 区块据此渲染。 */
  appUser: ProfileAppUser | null;
  copy: ProfilePageCopy;
  telegramSection: TelegramSection;
}
