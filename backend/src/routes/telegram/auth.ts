import { Hono } from 'hono';
import { Api } from 'telegram';

import { userPayload } from './helpers.js';
import { StringSession } from 'telegram/sessions/index.js';
import { computeCheck } from 'telegram/Password.js';
import {
  createFreshPendingClient,
  getOrCreatePendingClient,
  removePendingClient,
  getPooledClient,
} from '../../../lib/telegram/index.js';
import { getUserId, UnauthorizedError } from '../../../lib/auth.js';
import {
  ensureUser,
  bindTelegram,
  TelegramAlreadyBoundError,
} from '../../../lib/services/user/index.js';
import { prefetchUserProfile } from '../../../lib/services/telegram/prefetch.js';
import {
  SessionTag,
  TelegramAuthRequest,
} from '../../../types/telegram-login.js';

export const authRoutes = new Hono();

authRoutes.post('/auth/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as TelegramAuthRequest;
    const { session_tag } = body;

    switch (session_tag) {
      case SessionTag.SEND_CODE: {
        if (!body.phone_number) {
          return c.json(
            { success: false, error: 'phone_number is required for sendCode' },
            400,
          );
        }

        const client = await createFreshPendingClient(body.phone_number);
        const result = await client.sendCode(
          {
            apiId: Number(process.env.TELEGRAM_API_ID),
            apiHash: process.env.TELEGRAM_API_HASH!,
          },
          body.phone_number,
        );

        const pending_session = (client.session as StringSession).save();

        return c.json({
          success: true,
          phone_code_hash: result.phoneCodeHash,
          pending_session,
          code_type: result.isCodeViaApp ? 'app' : 'sms',
          timeout: null,
        });
      }

      case SessionTag.SIGN_IN: {
        if (!body.phone_number || !body.phone_code || !body.phone_code_hash) {
          return c.json(
            {
              success: false,
              error:
                'phone_number, phone_code, and phone_code_hash are required for signIn',
            },
            400,
          );
        }

        const client = body.pending_session
          ? await getPooledClient(body.pending_session)
          : await getOrCreatePendingClient(body.phone_number);

        try {
          const result = await client.invoke(
            new Api.auth.SignIn({
              phoneNumber: body.phone_number,
              phoneCodeHash: body.phone_code_hash,
              phoneCode: body.phone_code,
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
          removePendingClient(body.phone_number);

          const user = userPayload(authorization.user);
          await ensureUser(userId);
          await bindTelegram(userId, {
            telegramUserId: BigInt(user.id ?? '0'),
            username: user.username || undefined,
            firstName: user.first_name || undefined,
            phone: user.phone || undefined,
            sessionString: session,
          });

          prefetchUserProfile(session);

          return c.json({ success: true, session, user });
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            err.message.includes('SESSION_PASSWORD_NEEDED')
          ) {
            const session = (client.session as StringSession).save();
            return c.json({ success: false, require_2fa: true, session });
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
          firstName: user.first_name || undefined,
          phone: user.phone || undefined,
          sessionString: newSession,
        });

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
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    if (err instanceof TelegramAlreadyBoundError) {
      return c.json({ success: false, error: err.message }, 409);
    }
    const message =
      err instanceof Error ? err.message : 'Authentication failed';
    console.error('telegram auth error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
