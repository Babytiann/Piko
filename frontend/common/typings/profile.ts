/** Data contract for the Profile page (mirrors backend). */

export interface ProfileUser {
  displayName: string;
  username: string;
  phone: string;
  avatarUrl?: string;
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
