import { NextRequest, NextResponse } from 'next/server';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';
import {
  createFreshPendingClient,
  getOrCreatePendingClient,
  removePendingClient,
  getPooledClient,
} from '@/lib/telegram';
import { getUserId } from '@/lib/auth';
import { ensureUser, bindTelegram } from '@/lib/services/user';
import {
  SessionTag,
  type TelegramAuthRequest,
  type TelegramUser,
} from '@/types/telegram-login';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userPayload(user: Api.TypeUser): TelegramUser {
  return {
    id: user.id?.toString(),
    firstName: (user as Api.User).firstName ?? '',
    lastName: (user as Api.User).lastName ?? '',
    username: (user as Api.User).username ?? '',
    phone: (user as Api.User).phone ?? '',
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleSendCode(phoneNumber: string) {
  const client = await createFreshPendingClient(phoneNumber);

  const result = await client.sendCode(
    {
      apiId: Number(process.env.TELEGRAM_API_ID),
      apiHash: process.env.TELEGRAM_API_HASH!,
    },
    phoneNumber,
  );

  const codeType = result.isCodeViaApp ? 'app' : 'sms';

  return NextResponse.json({
    success: true,
    phoneCodeHash: result.phoneCodeHash,
    codeType,
    timeout: null,
  });
}

async function handleSignIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  userId: string,
) {
  const client = await getOrCreatePendingClient(phoneNumber);

  try {
    const result = await client.invoke(
      new Api.auth.SignIn({ phoneNumber, phoneCodeHash, phoneCode }),
    );

    if (result instanceof Api.auth.AuthorizationSignUpRequired) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account does not exist. Sign up is not supported.',
        },
        { status: 400 },
      );
    }

    const authorization = result as Api.auth.Authorization;

    const session = (client.session as StringSession).save();
    removePendingClient(phoneNumber);

    // 持久化用户 + TG 绑定到数据库
    const user = userPayload(authorization.user);
    await ensureUser(userId);
    await bindTelegram(userId, {
      telegramUserId: BigInt(user.id ?? '0'),
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      phone: user.phone || undefined,
      sessionString: session,
    });

    return NextResponse.json({
      success: true,
      session,
      user,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('SESSION_PASSWORD_NEEDED')
    ) {
      const session = (client.session as StringSession).save();
      return NextResponse.json({ success: false, require2FA: true, session });
    }
    throw err;
  }
}

async function handleCheckPassword(
  session: string,
  password: string,
  userId: string,
) {
  const client = await getPooledClient(session);

  const passwordInfo = await client.invoke(new Api.account.GetPassword());
  const srpPassword = await computeCheck(passwordInfo, password);

  const result = await client.invoke(
    new Api.auth.CheckPassword({ password: srpPassword }),
  );
  const authorization = result as Api.auth.Authorization;

  const newSession = (client.session as StringSession).save();

  // 持久化用户 + TG 绑定到数据库
  const user = userPayload(authorization.user);
  await ensureUser(userId);
  await bindTelegram(userId, {
    telegramUserId: BigInt(user.id ?? '0'),
    username: user.username || undefined,
    firstName: user.firstName || undefined,
    phone: user.phone || undefined,
    sessionString: newSession,
  });

  return NextResponse.json({
    success: true,
    session: newSession,
    user,
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = (await request.json()) as TelegramAuthRequest;
    const { session_tag } = body;

    switch (session_tag) {
      case SessionTag.SEND_CODE: {
        if (!body.phoneNumber) {
          return NextResponse.json(
            { success: false, error: 'phoneNumber is required for sendCode' },
            { status: 400 },
          );
        }
        return await handleSendCode(body.phoneNumber);
      }

      case SessionTag.SIGN_IN: {
        if (!body.phoneNumber || !body.phoneCode || !body.phoneCodeHash) {
          return NextResponse.json(
            {
              success: false,
              error:
                'phoneNumber, phoneCode, and phoneCodeHash are required for signIn',
            },
            { status: 400 },
          );
        }
        return await handleSignIn(
          body.phoneNumber,
          body.phoneCode,
          body.phoneCodeHash,
          userId,
        );
      }

      case SessionTag.CHECK_PASSWORD: {
        if (!body.session || !body.password) {
          return NextResponse.json(
            {
              success: false,
              error: 'session and password are required for checkPassword',
            },
            { status: 400 },
          );
        }
        return await handleCheckPassword(body.session, body.password, userId);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid session_tag: ${session_tag}` },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    console.error('telegram auth error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
