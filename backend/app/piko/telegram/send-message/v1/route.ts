import { NextResponse } from "next/server";
import {
  createAuthenticatedClient,
  disconnectClient,
  resolveInputPeer,
} from "@/lib/telegram";

/**
 * POST /piko/telegram/send-message/v1
 * Send a text message to a specific chat.
 *
 * Body: { session: string, chatId: string, chatType: string, accessHash: string, message: string, replyToMsgId?: number }
 * Returns: { success: true, messageId: number, date: number }
 */
export async function POST(request: Request) {
  let client;
  try {
    const { session, chatId, chatType, accessHash, message, replyToMsgId } =
      (await request.json()) as {
        session: string;
        chatId: string;
        chatType: string;
        accessHash: string;
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

    // Build the InputPeer directly instead of relying on entity cache
    const peer = resolveInputPeer(chatId, chatType, accessHash);

    const result = await client.sendMessage(peer, {
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
