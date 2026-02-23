/**
 * Telegram 路由
 *   POST /piko/telegram/auth/v1           — Telegram 登录（send_code / sign_in / check_password）
 *   POST /piko/telegram/unbind/v1         — 解绑 Telegram
 *   POST /piko/telegram/text_detail/v1   — 登录页文案
 *   POST /piko/telegram/get-dialogs/v1   — 获取对话列表（原始）
 *   POST /piko/telegram/get-messages/v1  — 获取消息列表（原始）
 *   POST /piko/telegram/send-message/v1  — 发送消息
 *   GET  /piko/telegram/media/v1         — 媒体文件代理（二进制）
 *   GET  /piko/telegram/avatar/v1        — 头像代理（binary JPEG）
 */

import { Hono } from 'hono';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';
import {
  createFreshPendingClient,
  getOrCreatePendingClient,
  removePendingClient,
  getPooledClient,
  resolveInputPeer,
} from '@/lib/telegram';
import { getUserId } from '@/lib/auth';
import {
  ensureUser,
  bindTelegram,
  unbindTelegram,
  getTelegramSession,
} from '@/lib/services/user';
import {
  downloadMessageMedia,
  downloadPeerPhoto,
} from '@/lib/services/telegram';
import { clearPhotoCache } from '@/lib/services/telegram/photo';
import { prefetchUserProfile } from '@/lib/services/telegram/prefetch';
import {
  SessionTag,
  TelegramLoginStep,
  type TelegramAuthRequest,
  type TelegramUser,
  type PhoneStepText,
  type VerifyCodeStepText,
  type VerifyTwoFAStepText,
} from '@/types/telegram-login';

export const telegramRoutes = new Hono();

// ── helpers ──────────────────────────────────────────────────────────────────

function userPayload(user: Api.TypeUser): TelegramUser {
  return {
    id: user.id?.toString(),
    firstName: (user as Api.User).firstName ?? '',
    lastName: (user as Api.User).lastName ?? '',
    username: (user as Api.User).username ?? '',
    phone: (user as Api.User).phone ?? '',
  };
}

// ── POST /auth/v1 ─────────────────────────────────────────────────────────────
telegramRoutes.post('/auth/v1', async (c) => {
  try {
    const userId = getUserId(c.req.raw);
    const body = (await c.req.json()) as TelegramAuthRequest;
    const { session_tag } = body;

    switch (session_tag) {
      case SessionTag.SEND_CODE: {
        if (!body.phoneNumber) {
          return c.json(
            { success: false, error: 'phoneNumber is required for sendCode' },
            400,
          );
        }

        const client = await createFreshPendingClient(body.phoneNumber);
        const result = await client.sendCode(
          {
            apiId: Number(process.env.TELEGRAM_API_ID),
            apiHash: process.env.TELEGRAM_API_HASH!,
          },
          body.phoneNumber,
        );

        // 序列化 session（包含 auth key 物料），回传给前端
        // signIn 时用此 session 恢复 client，保证 auth key 与 phoneCodeHash 匹配
        const pendingSession = (client.session as StringSession).save();

        return c.json({
          success: true,
          phoneCodeHash: result.phoneCodeHash,
          pendingSession,
          codeType: result.isCodeViaApp ? 'app' : 'sms',
          timeout: null,
        });
      }

      case SessionTag.SIGN_IN: {
        if (!body.phoneNumber || !body.phoneCode || !body.phoneCodeHash) {
          return c.json(
            {
              success: false,
              error:
                'phoneNumber, phoneCode, and phoneCodeHash are required for signIn',
            },
            400,
          );
        }

        // 优先用 sendCode 阶段回传的 pendingSession 恢复 client（auth key 完全一致）
        // 降级到内存 Map，兼容未携带 pendingSession 的旧请求
        const client = body.pendingSession
          ? await getPooledClient(body.pendingSession)
          : await getOrCreatePendingClient(body.phoneNumber);

        try {
          const result = await client.invoke(
            new Api.auth.SignIn({
              phoneNumber: body.phoneNumber,
              phoneCodeHash: body.phoneCodeHash,
              phoneCode: body.phoneCode,
            }),
          );

          if (result instanceof Api.auth.AuthorizationSignUpRequired) {
            return c.json(
              {
                success: false,
                error: 'Account does not exist. Sign up is not supported.',
              },
              400,
            );
          }

          const authorization = result as Api.auth.Authorization;
          const session = (client.session as StringSession).save();
          removePendingClient(body.phoneNumber);

          const user = userPayload(authorization.user);
          await ensureUser(userId);
          await bindTelegram(userId, {
            telegramUserId: BigInt(user.id ?? '0'),
            username: user.username || undefined,
            firstName: user.firstName || undefined,
            phone: user.phone || undefined,
            sessionString: session,
          });

          // 后台预热 profile 缓存，用户返回 profile 页时可秒开
          prefetchUserProfile(session);

          return c.json({ success: true, session, user });
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            err.message.includes('SESSION_PASSWORD_NEEDED')
          ) {
            const session = (client.session as StringSession).save();
            return c.json({ success: false, require2FA: true, session });
          }
          throw err;
        }
      }

      case SessionTag.CHECK_PASSWORD: {
        if (!body.session || !body.password) {
          return c.json(
            {
              success: false,
              error: 'session and password are required for checkPassword',
            },
            400,
          );
        }

        const client = await getPooledClient(body.session);
        const passwordInfo = await client.invoke(new Api.account.GetPassword());
        const srpPassword = await computeCheck(passwordInfo, body.password);

        const result = await client.invoke(
          new Api.auth.CheckPassword({ password: srpPassword }),
        );
        const authorization = result as Api.auth.Authorization;
        const newSession = (client.session as StringSession).save();

        const user = userPayload(authorization.user);
        await ensureUser(userId);
        await bindTelegram(userId, {
          telegramUserId: BigInt(user.id ?? '0'),
          username: user.username || undefined,
          firstName: user.firstName || undefined,
          phone: user.phone || undefined,
          sessionString: newSession,
        });

        // 后台预热 profile 缓存，用户返回 profile 页时可秒开
        prefetchUserProfile(newSession);

        return c.json({ success: true, session: newSession, user });
      }

      default:
        return c.json(
          { success: false, error: `Invalid session_tag: ${session_tag}` },
          400,
        );
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Authentication failed';
    console.error('telegram auth error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /unbind/v1 ───────────────────────────────────────────────────────────
telegramRoutes.post('/unbind/v1', async (c) => {
  try {
    const userId = getUserId(c.req.raw);

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
        const { removePooledClient } = await import('@/lib/telegram');
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
    const message = err instanceof Error ? err.message : 'Failed to unbind';
    console.error('telegram unbind error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /text_detail/v1 ──────────────────────────────────────────────────────
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

telegramRoutes.post('/text_detail/v1', async (c) => {
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
    // 文案为纯静态内容，缓存 1 小时
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get text detail';
    console.error('text_detail error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /get-dialogs/v1 ──────────────────────────────────────────────────────
telegramRoutes.post('/get-dialogs/v1', async (c) => {
  try {
    const {
      session,
      limit = 30,
      offsetDate,
    } = (await c.req.json()) as {
      session: string;
      limit?: number;
      offsetDate?: number;
    };

    if (!session) {
      return c.json({ success: false, error: 'session is required' }, 400);
    }

    const client = await getPooledClient(session);
    const dialogs = await client.getDialogs({ limit, offsetDate });

    const formattedDialogs = dialogs.map((dialog) => {
      const entity = dialog.entity;
      let title = dialog.title ?? 'Unknown';
      let type: 'user' | 'group' | 'channel' = 'user';
      let username = '';
      let accessHash = '';

      if (entity instanceof Api.User) {
        title =
          [entity.firstName, entity.lastName].filter(Boolean).join(' ') ||
          'Unknown';
        username = entity.username ?? '';
        type = 'user';
        accessHash = entity.accessHash?.toString() ?? '';
      } else if (entity instanceof Api.Chat) {
        title = entity.title;
        type = 'group';
      } else if (entity instanceof Api.Channel) {
        title = entity.title;
        username = entity.username ?? '';
        type = entity.megagroup ? 'group' : 'channel';
        accessHash = entity.accessHash?.toString() ?? '';
      }

      let lastMessage = '';
      let lastMessageDate: number | null = null;
      const msg = dialog.message;
      if (msg) {
        lastMessage = msg.message ?? '';
        lastMessageDate = msg.date ?? null;
      }

      return {
        id: dialog.id?.toString(),
        title,
        type,
        username,
        accessHash,
        unreadCount: dialog.unreadCount,
        lastMessage,
        lastMessageDate,
        pinned: dialog.pinned,
      };
    });

    return c.json({ success: true, dialogs: formattedDialogs });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get dialogs';
    console.error('get-dialogs error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /get-messages/v1 ─────────────────────────────────────────────────────
telegramRoutes.post('/get-messages/v1', async (c) => {
  try {
    const {
      session,
      chatId,
      chatType,
      accessHash,
      limit = 30,
      offsetId,
    } = (await c.req.json()) as {
      session: string;
      chatId: string;
      chatType: string;
      accessHash: string;
      limit?: number;
      offsetId?: number;
    };

    if (!session || !chatId) {
      return c.json(
        { success: false, error: 'session and chatId are required' },
        400,
      );
    }

    const client = await getPooledClient(session);
    const peer = resolveInputPeer(chatId, chatType, accessHash);
    const messages = await client.getMessages(peer, { limit, offsetId });

    const me = await client.getMe();
    const myId = me.id?.toString();

    const formattedMessages = messages.map((msg) => {
      let senderName = '';
      let senderId = '';
      const isOutgoing = msg.out ?? false;

      if (msg.sender) {
        if (msg.sender instanceof Api.User) {
          senderName =
            [msg.sender.firstName, msg.sender.lastName]
              .filter(Boolean)
              .join(' ') || 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        } else if (
          msg.sender instanceof Api.Chat ||
          msg.sender instanceof Api.Channel
        ) {
          senderName =
            (msg.sender as Api.Chat | Api.Channel).title ?? 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        }
      }

      return {
        id: msg.id,
        text: msg.message ?? '',
        date: msg.date,
        senderId,
        senderName,
        isOutgoing,
        isMe: senderId === myId,
        replyToMsgId: msg.replyTo
          ? ((msg.replyTo as Api.MessageReplyHeader).replyToMsgId ?? null)
          : null,
        hasMedia: !!msg.media,
        mediaType: msg.media ? msg.media.className : null,
      };
    });

    return c.json({ success: true, messages: formattedMessages });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get messages';
    console.error('get-messages error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /send-message/v1 ─────────────────────────────────────────────────────
telegramRoutes.post('/send-message/v1', async (c) => {
  try {
    const { session, chatId, chatType, accessHash, message, replyToMsgId } =
      (await c.req.json()) as {
        session: string;
        chatId: string;
        chatType: string;
        accessHash: string;
        message: string;
        replyToMsgId?: number;
      };

    if (!session || !chatId || !message) {
      return c.json(
        { success: false, error: 'session, chatId, and message are required' },
        400,
      );
    }

    const client = await getPooledClient(session);
    const peer = resolveInputPeer(chatId, chatType, accessHash);

    const result = await client.sendMessage(peer, {
      message,
      replyTo: replyToMsgId,
    });

    return c.json({ success: true, messageId: result.id, date: result.date });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to send message';
    console.error('send-message error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── GET /media/v1 ─────────────────────────────────────────────────────────────
telegramRoutes.get('/media/v1', async (c) => {
  try {
    const session = c.req.query('session');
    const chatId = c.req.query('chatId');
    const chatType = c.req.query('chatType') ?? 'user';
    const accessHash = c.req.query('accessHash') ?? '';
    const messageId = Number(c.req.query('messageId'));

    if (!session || !chatId || !messageId) {
      return c.json(
        {
          success: false,
          error: 'session, chatId, and messageId are required',
        },
        400,
      );
    }

    const result = await downloadMessageMedia(
      session,
      chatId,
      chatType,
      accessHash,
      messageId,
    );

    if (!result) {
      return c.json(
        { success: false, error: 'Media not found or not downloadable' },
        404,
      );
    }

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': result.mimeType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to download media';
    console.error('media download error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── GET /avatar/v1 ────────────────────────────────────────────────────────────
telegramRoutes.get('/avatar/v1', async (c) => {
  const session = c.req.query('session');
  const peerId = c.req.query('peerId');
  const peerType = c.req.query('peerType') ?? 'user';
  const accessHash = c.req.query('accessHash') ?? '';

  if (!session || !peerId) {
    return c.json({ error: 'session and peerId are required' }, 400);
  }

  try {
    const buffer = await downloadPeerPhoto(
      session,
      peerId,
      peerType,
      accessHash,
    );

    if (!buffer) {
      return c.json({ error: 'no photo' }, 404);
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch avatar';
    console.error('avatar error:', err);
    return c.json({ error: message }, 500);
  }
});
