/** Data contract for the Profile page. */

export interface ProfileUser {
  displayName: string;
  username: string;
  phone: string;
  /** Base64 data URI of the user's profile photo. */
  img_url?: string;
  avatarText: string;
  avatarColor: string;
}

export interface TelegramSection {
  title: string;
  isLoggedIn: boolean;
  user?: ProfileUser;
  unbindButtonText?: string;
  bindPrompt?: string;
  bindButtonText?: string;
}

export interface ProfilePageData {
  header: { title: string };
  telegramSection: TelegramSection;
}
