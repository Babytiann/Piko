import { NextResponse } from "next/server";
import { Api } from "telegram";
import { StringSession } from "telegram/sessions";
import {
  getOrCreatePendingClient,
  removePendingClient,
} from "@/lib/telegram";

/**
 * POST /piko/telegram/sign-in/v1
 * Sign in with phone number + verification code.
 *
 * Body: { phoneNumber: string, phoneCode: string, phoneCodeHash: string }
 * Returns:
 *   - Success: { success: true, session: string, user: { id, firstName, lastName, username, phone } }
 *   - 2FA required: { success: false, require2FA: true, session: string }
 *   - Sign up required: { success: false, requireSignUp: true }
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber, phoneCode, phoneCodeHash } =
      (await request.json()) as {
        phoneNumber: string;
        phoneCode: string;
        phoneCodeHash: string;
      };

    if (!phoneNumber || !phoneCode || !phoneCodeHash) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumber, phoneCode, and phoneCodeHash are required",
        },
        { status: 400 }
      );
    }

    const client = await getOrCreatePendingClient(phoneNumber);

    try {
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash,
          phoneCode,
        })
      );

      if (result instanceof Api.auth.AuthorizationSignUpRequired) {
        // Account doesn't exist — needs sign up
        return NextResponse.json({
          success: false,
          requireSignUp: true,
        });
      }

      // Success — extract user info
      const user = result.user;
      const session = (client.session as StringSession).save();
      removePendingClient(phoneNumber);

      return NextResponse.json({
        success: true,
        session,
        user: {
          id: user.id?.toString(),
          firstName: (user as Api.User).firstName ?? "",
          lastName: (user as Api.User).lastName ?? "",
          username: (user as Api.User).username ?? "",
          phone: (user as Api.User).phone ?? "",
        },
      });
    } catch (err: unknown) {
      // Check if 2FA is required
      if (
        err instanceof Error &&
        err.message.includes("SESSION_PASSWORD_NEEDED")
      ) {
        const session = (client.session as StringSession).save();
        return NextResponse.json({
          success: false,
          require2FA: true,
          session,
        });
      }
      throw err;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sign in";
    console.error("sign-in error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
