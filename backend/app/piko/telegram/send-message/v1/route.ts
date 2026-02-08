import { NextResponse } from "next/server";
import {
  createAuthenticatedClient,
  disconnectClient,
} from "@/lib/telegram";

/**
 * POST /piko/telegram/send-message/v1
 * Send a text message to a specific chat.
 *
 * Body: { session: string, chatId: string, message: string, replyToMsgId?: number }
 * Returns: { success: true, messageId: number, date: number }
 */
export async function POST(request: Request) {
  let client;
  try {
    const { session, chatId, message, replyToMsgId } =
      (await request.json()) as {
        session: string;
        chatId: string;
        message: string;
        replyToMsgId?: number;
      };

    if (!session || !chatId || !message) {
      return NextResponse.json(
        { success: false, error: "session, chatId, and message are required" },
        { status: 400 }
      );
    }

    client = await createAuthenticatedClient(session);

    const entity = await client.getEntity(chatId);

    const result = await client.sendMessage(entity, {
      message,
      replyTo: replyToMsgId,
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      date: result.date,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    console.error("send-message error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    if (client) await disconnectClient(client);
  }
}
