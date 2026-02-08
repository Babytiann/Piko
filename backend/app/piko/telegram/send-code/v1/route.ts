import { NextResponse } from "next/server";
import { Api } from "telegram";
import { getOrCreatePendingClient } from "@/lib/telegram";

/**
 * POST /piko/telegram/send-code/v1
 * Send a verification code to the given phone number.
 *
 * Body: { phoneNumber: string }
 * Returns: { phoneCodeHash: string, codeType: string }
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber } = (await request.json()) as {
      phoneNumber: string;
    };

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const client = await getOrCreatePendingClient(phoneNumber);

    const result = await client.sendCode(
      {
        apiId: Number(process.env.TELEGRAM_API_ID),
        apiHash: process.env.TELEGRAM_API_HASH!,
      },
      phoneNumber
    );

    // Determine code type name for the frontend
    let codeType = "unknown";
    if (result.type instanceof Api.auth.SentCodeTypeApp) {
      codeType = "app";
    } else if (result.type instanceof Api.auth.SentCodeTypeSms) {
      codeType = "sms";
    } else if (result.type instanceof Api.auth.SentCodeTypeCall) {
      codeType = "call";
    } else if (result.type instanceof Api.auth.SentCodeTypeFlashCall) {
      codeType = "flashCall";
    } else if (result.type instanceof Api.auth.SentCodeTypeMissedCall) {
      codeType = "missedCall";
    } else if (result.type instanceof Api.auth.SentCodeTypeFragmentSms) {
      codeType = "fragmentSms";
    } else if (result.type instanceof Api.auth.SentCodeTypeEmailCode) {
      codeType = "emailCode";
    }

    return NextResponse.json({
      success: true,
      phoneCodeHash: result.phoneCodeHash,
      codeType,
      timeout: result.timeout ?? null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send code";
    console.error("send-code error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
