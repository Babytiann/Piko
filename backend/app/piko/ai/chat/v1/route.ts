import { NextRequest } from 'next/server';
import { streamChat } from '@/lib/services/ai';
import type { AiChatRequest, SseEvent } from '@/types/ai';

/**
 * POST /piko/ai/chat/v1
 *
 * Accepts a conversation history and returns a Server-Sent Events stream
 * of Gemini model responses.
 *
 * Request body: { messages: [{ role: 'user'|'model', content: string }] }
 * Response: text/event-stream with JSON-encoded events per line.
 */
export async function POST(request: NextRequest) {
  // ── Parse & validate ───────────────────────────────────────────────
  let body: AiChatRequest;
  try {
    body = (await request.json()) as AiChatRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse('messages must be a non-empty array', 400);
  }

  const lastMsg = body.messages[body.messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.trim()) {
    return errorResponse('Last message must be a non-empty user message', 400);
  }

  // ── Stream ─────────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: SseEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        const result = await streamChat(body.messages);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            enqueue({ type: 'chunk', content: text });
          }
        }

        enqueue({ type: 'done' });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'AI service unavailable';
        console.error('[AI Chat] Stream error:', err);
        enqueue({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status });
}
