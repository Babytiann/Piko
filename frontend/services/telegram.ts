/**
 * Telegram authentication & legacy messaging APIs.
 * Auth endpoints return data at root level (no envelope),
 * so we use `postDirect` rather than the envelope-unwrapping `post`.
 */
import { postDirect } from './api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface SendMessageResponse {
  success: boolean;
  messageId: number;
  date: number;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export function sendCode(phoneNumber: string): Promise<SendCodeResponse> {
  return postDirect<SendCodeResponse>('telegram/send-code/v1', { phoneNumber });
}

export function signIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
): Promise<SignInResponse> {
  return postDirect<SignInResponse>('telegram/sign-in/v1', {
    phoneNumber,
    phoneCode,
    phoneCodeHash,
  });
}

export function checkPassword(
  session: string,
  password: string,
): Promise<CheckPasswordResponse> {
  return postDirect<CheckPasswordResponse>('telegram/check-password/v1', {
    session,
    password,
  });
}

export function signUp(
  phoneNumber: string,
  phoneCodeHash: string,
  firstName: string,
  lastName?: string,
): Promise<SignUpResponse> {
  return postDirect<SignUpResponse>('telegram/sign-up/v1', {
    phoneNumber,
    phoneCodeHash,
    firstName,
    lastName,
  });
}

// ---------------------------------------------------------------------------
// Messaging API (used by chat detail for send-message)
// ---------------------------------------------------------------------------

export function sendMessage(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  message: string,
  replyToMsgId?: number,
): Promise<SendMessageResponse> {
  return postDirect<SendMessageResponse>('telegram/send-message/v1', {
    session,
    chatId,
    chatType,
    accessHash,
    message,
    replyToMsgId,
  });
}
