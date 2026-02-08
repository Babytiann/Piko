import { NextResponse } from "next/server";
import { Api } from "telegram";
import { StringSession } from "telegram/sessions";
import {
  getOrCreatePendingClient,
  removePendingClient,
} from "@/lib/telegram";

/**
 * POST /piko/telegram/sign-up/v1
 * Register a new Telegram account.
 *
 * Body: { phoneNumber: string, phoneCodeHash: string, firstName: string, lastName?: string }
 * Returns: { success: true, session: string, user: { id, firstName, lastName, username, phone } }
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber, phoneCodeHash, firstName, lastName } =
      (await request.json()) as {
        phoneNumber: string;
        phoneCodeHash: string;
        firstName: string;
        lastName?: string;
      };

    if (!phoneNumber || !phoneCodeHash || !firstName) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumber, phoneCodeHash, and firstName are required",
        },
        { status: 400 }
      );
    }

    const client = await getOrCreatePendingClient(phoneNumber);

    const result = await client.invoke(
      new Api.auth.SignUp({
        phoneNumber,
        phoneCodeHash,
        firstName,
        lastName: lastName ?? "",
      })
    );

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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sign up";
    console.error("sign-up error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
