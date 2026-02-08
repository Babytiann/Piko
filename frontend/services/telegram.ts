import { Platform } from "react-native";

/**
 * Base URL for the Piko backend API.
 * On Android emulator, localhost is 10.0.2.2.
 * On iOS simulator and web, localhost works directly.
 */
const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000/piko/telegram"
    : "http://localhost:3000/piko/telegram";

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }
  return data as T;
}

// ─── Types ─────────────────────────────────────────────────────────

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
}

export interface SendCodeResponse {
  success: boolean;
  phoneCodeHash: string;
  codeType: string;
  timeout: number | null;
}

export interface SignInResponse {
  success: boolean;
  session?: string;
  user?: TelegramUser;
  require2FA?: boolean;
  requireSignUp?: boolean;
  error?: string;
}

export interface CheckPasswordResponse {
  success: boolean;
  session: string;
  user: TelegramUser;
}

export interface SignUpResponse {
  success: boolean;
  session: string;
  user: TelegramUser;
}

export interface Dialog {
  id: string;
  title: string;
  type: "user" | "group" | "channel";
  username: string;
  accessHash: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageDate: number | null;
  pinned: boolean;
}

export interface Message {
  id: number;
  text: string;
  date: number;
  senderId: string;
  senderName: string;
  isOutgoing: boolean;
  isMe: boolean;
  replyToMsgId: number | null;
  hasMedia: boolean;
  mediaType: string | null;
}

export interface GetDialogsResponse {
  success: boolean;
  dialogs: Dialog[];
}

export interface GetMessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface SendMessageResponse {
  success: boolean;
  messageId: number;
  date: number;
}

// ─── API Methods ───────────────────────────────────────────────────

export function sendCode(phoneNumber: string): Promise<SendCodeResponse> {
  return post<SendCodeResponse>("send-code/v1", { phoneNumber });
}

export function signIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string
): Promise<SignInResponse> {
  return post<SignInResponse>("sign-in/v1", {
    phoneNumber,
    phoneCode,
    phoneCodeHash,
  });
}

export function checkPassword(
  session: string,
  password: string
): Promise<CheckPasswordResponse> {
  return post<CheckPasswordResponse>("check-password/v1", {
    session,
    password,
  });
}

export function signUp(
  phoneNumber: string,
  phoneCodeHash: string,
  firstName: string,
  lastName?: string
): Promise<SignUpResponse> {
  return post<SignUpResponse>("sign-up/v1", {
    phoneNumber,
    phoneCodeHash,
    firstName,
    lastName,
  });
}

export function getDialogs(
  session: string,
  limit = 30,
  offsetDate?: number
): Promise<GetDialogsResponse> {
  return post<GetDialogsResponse>("get-dialogs/v1", {
    session,
    limit,
    offsetDate,
  });
}

export function getMessages(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  limit = 30,
  offsetId?: number
): Promise<GetMessagesResponse> {
  return post<GetMessagesResponse>("get-messages/v1", {
    session,
    chatId,
    chatType,
    accessHash,
    limit,
    offsetId,
  });
}

export function sendMessage(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  message: string,
  replyToMsgId?: number
): Promise<SendMessageResponse> {
  return post<SendMessageResponse>("send-message/v1", {
    session,
    chatId,
    chatType,
    accessHash,
    message,
    replyToMsgId,
  });
}
