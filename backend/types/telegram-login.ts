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
  phoneNumber?: string;
  /** signIn */
  phoneCode?: string;
  /** signIn */
  phoneCodeHash?: string;
  /** signIn — sendCode 阶段序列化的 session 字符串，用于恢复同一 auth key */
  pendingSession?: string;
  /** checkPassword */
  session?: string;
  /** checkPassword */
  password?: string;
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName: string;
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
  phonePlaceholder: string;
  sendCodeButton: string;
  countryPickerHeader: string;
  defaultCountry: string;
  countries: CountryItem[];
  errors: {
    emptyPhone: string;
    sendCodeFail: string;
  };
}

export interface VerifyCodeStepText {
  title: string;
  subtitle: string;
  codeSentLabel: string;
  codePlaceholder: string;
  verifyButton: string;
  backLink: string;
  errors: {
    emptyCode: string;
    signInFail: string;
  };
}

export interface VerifyTwoFAStepText {
  title: string;
  subtitle: string;
  passwordPlaceholder: string;
  confirmButton: string;
  errors: {
    emptyPassword: string;
    checkPasswordFail: string;
  };
}

export type TelegramLoginText =
  | PhoneStepText
  | VerifyCodeStepText
  | VerifyTwoFAStepText;
