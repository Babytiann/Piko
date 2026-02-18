import { API_HOST } from '@/common/config';
import { post } from '@/services';
import type { SseEvent, AiCopywriting } from '@/pages/ai-chat/types';

const SSE_URL = `${API_HOST}/piko/ai/chat/v1`;

/**
 * Fetch all user-facing copywriting for the AI chat page.
 */
export function fetchAiCopywriting(): Promise<AiCopywriting> {
  return post<AiCopywriting>('ai/copywriting/v1');
}

/** Message shape sent to the backend. */
interface ChatPayload {
  role: 'user' | 'model';
  content: string;
}

interface StreamOptions {
  messages: ChatPayload[];
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  /** [模块 2] 工具开始调用，message 是后端下发的状态文案 */
  onToolStart?: (
    tool: string,
    args: Record<string, unknown>,
    message: string,
  ) => void;
  /** [模块 2] 工具调用结束 */
  onToolEnd?: (tool: string, success: boolean) => void;
}

export function streamAiChat({
  messages,
  onChunk,
  onDone,
  onError,
  onToolStart,
  onToolEnd,
}: StreamOptions): () => void {
  const xhr = new XMLHttpRequest();
  let lastIndex = 0;
  let buffer = '';
  let finished = false;

  /** Extract and dispatch newly arrived SSE events. */
  function processNewData(): void {
    if (finished) return;

    const newText = xhr.responseText.slice(lastIndex);
    lastIndex = xhr.responseText.length;
    if (!newText) return;

    buffer += newText;

    // SSE events are separated by double newlines.
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;

      const parsed: SseEvent = JSON.parse(dataLine.slice(6));
      switch (parsed.type) {
        case 'chunk':
          onChunk(parsed.content);
          break;
        case 'tool_start':
          onToolStart?.(parsed.tool, parsed.args, parsed.message);
          break;
        case 'tool_end':
          onToolEnd?.(parsed.tool, parsed.success);
          break;
        case 'done':
          finished = true;
          onDone();
          xhr.abort();
          return;
        case 'error':
          finished = true;
          onError(parsed.message);
          xhr.abort();
          return;
      }
    }
  }

  xhr.open('POST', SSE_URL);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.timeout = 120_000;

  xhr.onprogress = processNewData;

  xhr.onload = () => {
    processNewData();
    if (!finished) {
      finished = true;
      onDone();
    }
  };

  xhr.onerror = () => {
    if (!finished) {
      finished = true;
      onError('连接中断，请稍后重试');
    }
  };

  xhr.ontimeout = () => {
    if (!finished) {
      finished = true;
      onError('请求超时，请稍后重试');
    }
  };

  xhr.send(JSON.stringify({ messages }));

  return () => {
    finished = true;
    xhr.abort();
  };
}
