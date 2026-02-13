import { post, postDirect } from './api-client';
import type {
  TelegramAuthRequest,
  SendCodeResult,
  SignInResult,
  CheckPasswordResult,
  TelegramLoginText,
} from '@/types/telegram-login';
import {
  SessionTag,
  TelegramLoginStep,
  type PhoneStepText,
  type VerifyCodeStepText,
  type VerifyTwoFAStepText,
} from '@/types/telegram-login';

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

export type { TelegramUser } from '@/types/telegram-login';

function telegramAuth<T>(params: TelegramAuthRequest): Promise<T> {
  return postDirect<T>(
    'telegram/auth/v1',
    params as unknown as Record<string, unknown>,
  );
}

export function sendCode(phoneNumber: string): Promise<SendCodeResult> {
  return telegramAuth<SendCodeResult>({
    session_tag: SessionTag.SEND_CODE,
    phoneNumber,
  });
}

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
