// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** 认证操作标识 */
export enum SessionTag {
  SEND_CODE = 'sendCode',
  SIGN_IN = 'signIn',
  CHECK_PASSWORD = 'checkPassword',
}

/** 登录流程步骤（第一个值从 1 开始） */
export enum TelegramLoginStep {
  PHONE = 1,
  VERIFY_CODE = 2,
  VERIFY_2FA = 3,
}

// ---------------------------------------------------------------------------
// Auth request / response types
// ---------------------------------------------------------------------------

export interface TelegramAuthRequest {
  session_tag: SessionTag;
  /** sendCode / signIn */
  phone_number?: string;
  /** signIn */
  phone_code?: string;
  /** signIn */
  phone_code_hash?: string;
  /** signIn — sendCode 阶段序列化的 session 字符串，用于恢复同一 auth key */
  pending_session?: string;
  /** checkPassword */
  session?: string;
  /** checkPassword */
  password?: string;
}

export interface TelegramUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Text detail types
// ---------------------------------------------------------------------------

export interface CountryItem {
  name: string;
  code: string;
}

export interface PhoneStepText {
  title: string;
  subtitle: string;
  phone_placeholder: string;
  send_code_button: string;
  country_picker_header: string;
  default_country: string;
  countries: CountryItem[];
  errors: {
    empty_phone: string;
    send_code_fail: string;
  };
}

export interface VerifyCodeStepText {
  title: string;
  subtitle: string;
  code_sent_label: string;
  code_placeholder: string;
  verify_button: string;
  back_link: string;
  errors: {
    empty_code: string;
    sign_in_fail: string;
  };
}

export interface VerifyTwoFAStepText {
  title: string;
  subtitle: string;
  password_placeholder: string;
  confirm_button: string;
  errors: {
    empty_password: string;
    check_password_fail: string;
  };
}

export type TelegramLoginText =
  | PhoneStepText
  | VerifyCodeStepText
  | VerifyTwoFAStepText;
