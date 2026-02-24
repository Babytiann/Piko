/** Data contract for the Profile page (mirrors backend). */

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
  footer: {
    versionLabel: string;
    uidLabel: string;
    didLabel: string;
  };
}

export interface ProfilePageData {
  header: { title: string };
  copy: ProfilePageCopy;
  telegramSection: TelegramSection;
}
