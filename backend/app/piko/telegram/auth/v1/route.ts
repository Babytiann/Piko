import { NextResponse } from 'next/server';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';
import {
  createFreshPendingClient,
  getOrCreatePendingClient,
  removePendingClient,
  createAuthenticatedClient,
  disconnectClient,
} from '@/lib/telegram';
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

  let codeType = 'unknown';
  if (result.type instanceof Api.auth.SentCodeTypeApp) {
    codeType = 'app';
  } else if (result.type instanceof Api.auth.SentCodeTypeSms) {
    codeType = 'sms';
  } else if (result.type instanceof Api.auth.SentCodeTypeCall) {
    codeType = 'call';
  } else if (result.type instanceof Api.auth.SentCodeTypeFlashCall) {
    codeType = 'flashCall';
  } else if (result.type instanceof Api.auth.SentCodeTypeMissedCall) {
    codeType = 'missedCall';
  } else if (result.type instanceof Api.auth.SentCodeTypeFragmentSms) {
    codeType = 'fragmentSms';
  } else if (result.type instanceof Api.auth.SentCodeTypeEmailCode) {
    codeType = 'emailCode';
  }

  return NextResponse.json({
    success: true,
    phoneCodeHash: result.phoneCodeHash,
    codeType,
    timeout: result.timeout ?? null,
  });
}

async function handleSignIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
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

    const session = (client.session as StringSession).save();
    removePendingClient(phoneNumber);

    return NextResponse.json({
      success: true,
      session,
      user: userPayload(result.user),
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

async function handleCheckPassword(session: string, password: string) {
  const client = await createAuthenticatedClient(session);

  try {
    const passwordInfo = await client.invoke(new Api.account.GetPassword());
    const srpPassword = await computeCheck(passwordInfo, password);

    const result = await client.invoke(
      new Api.auth.CheckPassword({ password: srpPassword }),
    );

    const newSession = (client.session as StringSession).save();

    return NextResponse.json({
      success: true,
      session: newSession,
      user: userPayload(result.user),
    });
  } finally {
    await disconnectClient(client);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * POST /piko/telegram/auth/v1
 *
 * Unified Telegram authentication endpoint.
 * Dispatches to sendCode / signIn / checkPassword based on `session_tag`.
 */
export async function POST(request: Request) {
  try {
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
        return await handleCheckPassword(body.session, body.password);
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
