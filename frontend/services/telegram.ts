/**
 * Telegram authentication & messaging APIs.
 *
 * Auth calls go through the unified `/telegram/auth/v1` endpoint,
 * dispatched by `session_tag`.
 *
 * Page copy is fetched via `/telegram/text_detail/v1`.
 */
import { fetch, HttpError } from '@/services';
import type {
  TelegramAuthRequest,
  SendCodeResult,
  SignInResult,
  CheckPasswordResult,
  TelegramLoginText,
} from '@/common/typings/telegram-login';
import {
  SessionTag,
  TelegramLoginStep,
  type PhoneStepText,
  type VerifyCodeStepText,
  type VerifyTwoFAStepText,
} from '@/common/typings/telegram-login';

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { SessionTag, TelegramLoginStep };
export type {
  SendCodeResult,
  SignInResult,
  CheckPasswordResult,
  PhoneStepText,
  VerifyCodeStepText,
  VerifyTwoFAStepText,
  TelegramLoginText,
};

// Re-export user type so existing consumers don't break
export type { TelegramUser } from '@/common/typings/telegram-login';

// ---------------------------------------------------------------------------
// Unified auth API
// ---------------------------------------------------------------------------

/**
 * Unified Telegram authentication call.
 * Use `session_tag` to select the operation.
 */
async function telegramAuth<T>(params: TelegramAuthRequest): Promise<T> {
  const res = await fetch<TelegramAuthRequest, T>({
    method: 'POST',
    path: 'telegram/auth/v1',
    body: params as unknown as Record<string, unknown>,
    raw: true,
  });
  if (!res.success)
    throw new HttpError(res.error ?? 'Request failed', res.status ?? 0);
  return res.data as T;
}

/** Send verification code to a phone number. */
export function sendCode(phoneNumber: string): Promise<SendCodeResult> {
  return telegramAuth<SendCodeResult>({
    session_tag: SessionTag.SEND_CODE,
    phoneNumber,
  });
}

/** Sign in with phone number + verification code. */
export function signIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  pendingSession?: string,
): Promise<SignInResult> {
  return telegramAuth<SignInResult>({
    session_tag: SessionTag.SIGN_IN,
    phoneNumber,
    phoneCode,
    phoneCodeHash,
    ...(pendingSession ? { pendingSession } : {}),
  });
}

/** Complete 2FA login by providing the password. */
export function checkPassword(
  session: string,
  password: string,
): Promise<CheckPasswordResult> {
  return telegramAuth<CheckPasswordResult>({
    session_tag: SessionTag.CHECK_PASSWORD,
    session,
    password,
  });
}

// ---------------------------------------------------------------------------
// Text detail API
// ---------------------------------------------------------------------------

/** Fetch page copy for a given login step. */
export async function fetchTelegramText(
  step: TelegramLoginStep.PHONE,
): Promise<PhoneStepText>;
export async function fetchTelegramText(
  step: TelegramLoginStep.VERIFY_CODE,
): Promise<VerifyCodeStepText>;
export async function fetchTelegramText(
  step: TelegramLoginStep.VERIFY_2FA,
): Promise<VerifyTwoFAStepText>;
export async function fetchTelegramText(
  step: TelegramLoginStep,
): Promise<TelegramLoginText> {
  const res = await fetch<{ step: TelegramLoginStep }, TelegramLoginText>({
    method: 'POST',
    path: 'telegram/text_detail/v1',
    body: { step },
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

/** 正式注销 Telegram 会话，在 Telegram 服务端使 session 失效。 */
export async function unbindTelegram(
  session: string,
): Promise<{ success: boolean }> {
  const res = await fetch<{ session: string }, { success: boolean }>({
    method: 'POST',
    path: 'telegram/unbind/v1',
    body: { session },
    raw: true,
  });
  if (!res.success)
    throw new HttpError(res.error ?? 'Request failed', res.status ?? 0);
  return res.data as { success: boolean };
}

export interface SendMessageResponse {
  success: boolean;
  messageId: number;
  date: number;
}

export async function sendMessage(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  message: string,
  replyToMsgId?: number,
): Promise<SendMessageResponse> {
  const res = await fetch<
    {
      session: string;
      chatId: string;
      chatType: string;
      accessHash: string;
      message: string;
      replyToMsgId?: number;
    },
    SendMessageResponse
  >({
    method: 'POST',
    path: 'telegram/send-message/v1',
    body: { session, chatId, chatType, accessHash, message, replyToMsgId },
    raw: true,
  });
  if (!res.success)
    throw new HttpError(res.error ?? 'Request failed', res.status ?? 0);
  return res.data as SendMessageResponse;
}
