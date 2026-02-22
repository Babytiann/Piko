import { API_HOST } from '@/common/config';
import { post } from '@/services';
import type {
  SseEvent,
  AiCopywriting,
  ConversationItem,
  AiMessage as AiChatMessage,
} from '@/pages/ai-chat/types';
import type { RecognizeResult } from '@/pages/scan/types';

const SSE_URL = `${API_HOST}/piko/ai/chat/v1`;
const LOCATION_URL = `${API_HOST}/piko/ai/location/v1`;

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
  conversationId?: string | null;
  requestId?: string;
  onChunk: (text: string) => void;
  onDone: (conversationId?: string) => void;
  onError: (error: string) => void;
  onConversation?: (conversationId: string) => void;
  /** [模块 2] 工具开始调用，message 是后端下发的状态文案 */
  onToolStart?: (
    tool: string,
    args: Record<string, unknown>,
    message: string,
  ) => void;
  /** [模块 2] 工具调用结束 */
  onToolEnd?: (tool: string, success: boolean) => void;
  /** 后端请求获取用户位置，前端获取后回传 */
  onRequestLocation?: (requestId: string) => void;
}

export function streamAiChat({
  messages,
  conversationId,
  requestId,
  onChunk,
  onDone,
  onError,
  onConversation,
  onToolStart,
  onToolEnd,
  onRequestLocation,
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
        case 'request_location':
          onRequestLocation?.(parsed.requestId);
          break;
        case 'conversation':
          onConversation?.(parsed.conversationId);
          break;
        case 'done':
          finished = true;
          onDone(parsed.conversationId);
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
  // Mock Auth header（Apple 登录接入后改为 Authorization: Bearer <jwt>）
  xhr.setRequestHeader('X-Mock-User-Id', 'mock-user-001');
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

  xhr.send(
    JSON.stringify({
      messages,
      ...(conversationId && { conversationId }),
      ...(requestId && { requestId }),
    }),
  );

  return () => {
    finished = true;
    xhr.abort();
  };
}

/** 回传用户位置数据给后端 */
export function postLocationResponse(
  requestId: string,
  location: { latitude: number; longitude: number } | null,
): void {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', LOCATION_URL);
  xhr.setRequestHeader('Content-Type', 'application/json');
  // Mock Auth header（Apple 登录接入后改为 Authorization: Bearer <jwt>）
  xhr.setRequestHeader('X-Mock-User-Id', 'mock-user-001');
  xhr.send(JSON.stringify({ requestId, location }));
}

/** 调用 Gemini Vision 识别消费票据/截图 */
export async function recognizeExpense(
  imageBase64: string,
  mimeType: string,
): Promise<RecognizeResult> {
  return post<RecognizeResult>('ai/recognize/v1', {
    image: imageBase64,
    mimeType,
  });
}

// ---------------------------------------------------------------------------
// Conversation CRUD
// ---------------------------------------------------------------------------

/** 获取会话列表 */
export function fetchConversationList(): Promise<ConversationItem[]> {
  return post<ConversationItem[]>('ai/conversation/list/v1');
}

/** 获取会话详情（含消息） */
export function fetchConversationDetail(conversationId: string): Promise<{
  id: string;
  title: string;
  messages: { role: 'user' | 'model'; content: string; createdAt: string }[];
}> {
  return post('ai/conversation/detail/v1', { conversationId });
}

/** 创建新会话 */
export function createConversation(
  title?: string,
): Promise<{ id: string; title: string }> {
  return post('ai/conversation/create/v1', { title });
}

/** 删除会话 */
export function deleteConversation(conversationId: string): Promise<void> {
  return post('ai/conversation/delete/v1', { conversationId });
}

// ---------------------------------------------------------------------------
// Expense API
// ---------------------------------------------------------------------------

/** 上传消费记录 */
export function uploadExpense(data: {
  amount: number;
  merchant?: string;
  category?: string;
  date?: string;
  items?: string[];
  source: 'camera' | 'album' | 'manual';
  image?: string;
  mimeType?: string;
}): Promise<{ id: string; amount: number }> {
  return post('expense/upload/v1', data as Record<string, unknown>);
}

/** 获取消费记录列表 */
export function fetchExpenseList(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{
  expenses: Array<{
    id: string;
    amount: number;
    merchant: string | null;
    category: string;
    date: string;
    source: string;
    imageUrl: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}> {
  return post('expense/list/v1', (params ?? {}) as Record<string, unknown>);
}
