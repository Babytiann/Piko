/**
 * Telegram authentication & messaging APIs.
 *
 * Auth calls go through the unified `/telegram/auth/v1` endpoint,
 * dispatched by `session_tag`.
 *
 * Page copy is fetched via `/telegram/text_detail/v1`.
 */
import { post, postDirect } from '@/common/services/api-client';
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
function telegramAuth<T>(params: TelegramAuthRequest): Promise<T> {
  return postDirect<T>(
    'telegram/auth/v1',
    params as unknown as Record<string, unknown>,
  );
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
): Promise<SignInResult> {
  return telegramAuth<SignInResult>({
    session_tag: SessionTag.SIGN_IN,
    phoneNumber,
    phoneCode,
    phoneCodeHash,
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
export function fetchTelegramText(
  step: TelegramLoginStep.PHONE,
): Promise<PhoneStepText>;
export function fetchTelegramText(
  step: TelegramLoginStep.VERIFY_CODE,
): Promise<VerifyCodeStepText>;
export function fetchTelegramText(
  step: TelegramLoginStep.VERIFY_2FA,
): Promise<VerifyTwoFAStepText>;
export function fetchTelegramText(
  step: TelegramLoginStep,
): Promise<TelegramLoginText> {
  return post<TelegramLoginText>('telegram/text_detail/v1', { step });
}

// ---------------------------------------------------------------------------
// Messaging API (unchanged — used by chat detail)
// ---------------------------------------------------------------------------

export interface SendMessageResponse {
  success: boolean;
  messageId: number;
  date: number;
}

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
