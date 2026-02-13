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

export interface SendCodeResult {
  success: boolean;
  phoneCodeHash: string;
  codeType: string;
  timeout: number | null;
}

export interface SignInResult {
  success: boolean;
  session?: string;
  user?: TelegramUser;
  require2FA?: boolean;
  error?: string;
}

export interface CheckPasswordResult {
  success: boolean;
  session: string;
  user: TelegramUser;
}

/** Discriminated union returned by the unified auth endpoint */
export type TelegramAuthResponse =
  | SendCodeResult
  | SignInResult
  | CheckPasswordResult;

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
