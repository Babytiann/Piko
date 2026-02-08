import { NextResponse } from "next/server";
import { Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { computeCheck } from "telegram/Password";
import {
  createAuthenticatedClient,
  disconnectClient,
} from "@/lib/telegram";

/**
 * POST /piko/telegram/check-password/v1
 * Complete 2FA login by providing the password.
 *
 * Body: { session: string, password: string }
 * Returns: { success: true, session: string, user: { id, firstName, lastName, username, phone } }
 */
export async function POST(request: Request) {
  let client;
  try {
    const { session, password } = (await request.json()) as {
      session: string;
      password: string;
    };

    if (!session || !password) {
      return NextResponse.json(
        { success: false, error: "session and password are required" },
        { status: 400 }
      );
    }

    client = await createAuthenticatedClient(session);

    // Get the SRP password parameters
    const passwordInfo = await client.invoke(
      new Api.account.GetPassword()
    );

    // Compute the SRP check using the dedicated password module
    const srpPassword = await computeCheck(passwordInfo, password);

    const result = await client.invoke(
      new Api.auth.CheckPassword({
        password: srpPassword,
      })
    );

    const user = result.user;
    const newSession = (client.session as StringSession).save();

    return NextResponse.json({
      success: true,
      session: newSession,
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
      error instanceof Error ? error.message : "Failed to check password";
    console.error("check-password error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    if (client) await disconnectClient(client);
  }
}
