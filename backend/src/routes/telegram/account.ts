import { Hono } from 'hono';
import { Api } from 'telegram';
import {
  getPooledClient,
  removePooledClient,
} from '../../../lib/telegram/index.js';
import { getUserId, UnauthorizedError } from '../../../lib/auth.js';
import {
  getTelegramSession,
  unbindTelegram,
} from '../../../lib/services/user/index.js';
import { clearPhotoCache } from '../../../lib/services/telegram/photo/index.js';
import {
  TelegramLoginStep,
  type PhoneStepText,
  type VerifyCodeStepText,
  type VerifyTwoFAStepText,
} from '../../../types/telegram-login.js';

export const accountRoutes = new Hono();

const phoneStepText: PhoneStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你的手机号以连接 Telegram',
  phone_placeholder: '手机号',
  send_code_button: '发送验证码',
  country_picker_header: '国家/地区',
  default_country: '中国',
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
    empty_phone: '请输入手机号',
    send_code_fail: '发送验证码失败',
  },
};

const verifyCodeStepText: VerifyCodeStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你收到的验证码',
  code_sent_label: '验证码已发送至 {phoneNumber}',
  code_placeholder: '输入验证码',
  verify_button: '验证登录',
  back_link: '返回修改手机号',
  errors: {
    empty_code: '请输入验证码',
    sign_in_fail: '登录失败',
  },
};

const verifyTwoFAStepText: VerifyTwoFAStepText = {
  title: '绑定 Telegram 账号',
  subtitle: '输入你的两步验证密码',
  password_placeholder: '两步验证密码',
  confirm_button: '确认密码',
  errors: {
    empty_password: '请输入两步验证密码',
    check_password_fail: '密码验证失败',
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

accountRoutes.post('/unbind/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);

    let bodySession: string | undefined;
    try {
      const body = (await c.req.json()) as { session?: string };
      bodySession = body.session || undefined;
    } catch {
      // body 可能为空
    }

    const session = (await getTelegramSession(userId)) ?? bodySession;

    if (session) {
      try {
        const client = await getPooledClient(session);
        await client.invoke(new Api.auth.LogOut());
        await removePooledClient(session);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('AUTH_KEY_UNREGISTERED')) {
          console.error('telegram unbind warning:', err);
        }
      }
    }

    if (session) clearPhotoCache(session);
    await unbindTelegram(userId);

    return c.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message = err instanceof Error ? err.message : 'Failed to unbind';
    console.error('telegram unbind error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

accountRoutes.post('/text_detail/v1', async (c) => {
  try {
    const { step } = (await c.req.json()) as { step: number };

    if (!Object.values(TelegramLoginStep).includes(step as TelegramLoginStep)) {
      return c.json(
        {
          success: false,
          error: `Invalid step: ${step}. Expected one of ${Object.values(
            TelegramLoginStep,
          )
            .filter((v) => typeof v === 'number')
            .join(', ')}`,
        },
        400,
      );
    }

    const data = textMap[step as TelegramLoginStep];
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get text detail';
    console.error('text_detail error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
