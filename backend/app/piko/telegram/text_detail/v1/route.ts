import { NextResponse } from 'next/server';
import {
  TelegramLoginStep,
  type PhoneStepText,
  type VerifyCodeStepText,
  type VerifyTwoFAStepText,
} from '@/types/telegram-login';

// ---------------------------------------------------------------------------
// Static text data
// ---------------------------------------------------------------------------

const phoneStepText: PhoneStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你的手机号以连接 Telegram',
  phonePlaceholder: '手机号',
  sendCodeButton: '发送验证码',
  countryPickerHeader: '国家/地区',
  defaultCountry: '中国',
  countries: [
    { name: '中国', code: '+86' },
    { name: '中国香港', code: '+852' },
    { name: '中国澳门', code: '+853' },
    { name: '中国台湾', code: '+886' },
    { name: '美国', code: '+1' },
    { name: '英国', code: '+44' },
    { name: '日本', code: '+81' },
    { name: '韩国', code: '+82' },
    { name: '新加坡', code: '+65' },
    { name: '马来西亚', code: '+60' },
    { name: '泰国', code: '+66' },
    { name: '印度', code: '+91' },
    { name: '澳大利亚', code: '+61' },
    { name: '加拿大', code: '+1' },
    { name: '德国', code: '+49' },
    { name: '法国', code: '+33' },
    { name: '意大利', code: '+39' },
    { name: '俄罗斯', code: '+7' },
    { name: '巴西', code: '+55' },
    { name: '印度尼西亚', code: '+62' },
    { name: '菲律宾', code: '+63' },
    { name: '越南', code: '+84' },
    { name: '阿联酋', code: '+971' },
    { name: '新西兰', code: '+64' },
    { name: '荷兰', code: '+31' },
    { name: '西班牙', code: '+34' },
    { name: '葡萄牙', code: '+351' },
    { name: '土耳其', code: '+90' },
    { name: '沙特阿拉伯', code: '+966' },
    { name: '埃及', code: '+20' },
  ],
  errors: {
    emptyPhone: '请输入手机号',
    sendCodeFail: '发送验证码失败',
  },
};

const verifyCodeStepText: VerifyCodeStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你收到的验证码',
  codeSentLabel: '验证码已发送至 {phoneNumber}',
  codePlaceholder: '输入验证码',
  verifyButton: '验证登录',
  backLink: '返回修改手机号',
  errors: {
    emptyCode: '请输入验证码',
    signInFail: '登录失败',
  },
};

const verifyTwoFAStepText: VerifyTwoFAStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你的两步验证密码',
  passwordPlaceholder: '两步验证密码',
  confirmButton: '确认密码',
  errors: {
    emptyPassword: '请输入两步验证密码',
    checkPasswordFail: '密码验证失败',
  },
};

const textMap: Record<
  TelegramLoginStep,
  PhoneStepText | VerifyCodeStepText | VerifyTwoFAStepText
> = {
  [TelegramLoginStep.PHONE]: phoneStepText,
  [TelegramLoginStep.VERIFY_CODE]: verifyCodeStepText,
  [TelegramLoginStep.VERIFY_2FA]: verifyTwoFAStepText,
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * POST /piko/telegram/text_detail/v1
 *
 * Returns page copy for the Telegram login flow.
 * Body: { step: TelegramLoginStep }
 */
export async function POST(request: Request) {
  try {
    const { step } = (await request.json()) as { step: number };

    if (!Object.values(TelegramLoginStep).includes(step as TelegramLoginStep)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid step: ${step}. Expected one of ${Object.values(
            TelegramLoginStep,
          )
            .filter((v) => typeof v === 'number')
            .join(', ')}`,
        },
        { status: 400 },
      );
    }

    const data = textMap[step as TelegramLoginStep];

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get text detail';
    console.error('text_detail error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
