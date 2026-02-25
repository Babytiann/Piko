import type { ApiResponse } from '@/common/typings/api';
import { API_HOST } from '@/common/config';
import { fetch } from '@/services';
import { authClient } from '@/services/auth-client';
import type {
  AiPageData,
  ConversationItem,
  AiMessage as AiChatMessage,
} from '@/pages/ai-chat/types';
import type { RecognizeResult } from '@/pages/scan/types';

const SSE_URL = `${API_HOST}/piko/ai/chat/v1`;
const LOCATION_URL = `${API_HOST}/piko/ai/location/v1`;

/**
 * Fetch all user-facing page data for the AI chat page.
 * Network errors return { success: false } instead of throwing.
 */
export function fetchAiPageData(): Promise<ApiResponse<AiPageData>> {
  return fetch<Record<string, never>, AiPageData>({
    method: 'POST',
    path: 'ai/page_data/v1',
    body: {},
  });
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

  /**
   * 解析 Vercel AI SDK Data Stream 格式。
   *
   * 协议行格式:
   *   0:"text chunk"      — 文本片段 (type 0)
   *   2:[{...},{...}]     — custom data array (type 2)
   *   d:{finishReason}    — 流结束标记 (type d)
   *   3:"error message"  — 错误 (type 3)
   *   8:{...}             — 消息元数据 (type 8，忽略)
   *   e:{...}             — step finish (type e，忽略)
   */
  function processNewData(): void {
    if (finished) return;

    const newText = xhr.responseText.slice(lastIndex);
    lastIndex = xhr.responseText.length;
    if (!newText) return;

    buffer += newText;

    // 按换行分割处理每一行
    const lines = buffer.split('\n');
    // 最后一行可能不完整，保留在 buffer 中
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const typeStr = line.slice(0, colonIdx);
      const valueStr = line.slice(colonIdx + 1);

      try {
        switch (typeStr) {
          case '0': {
            // 文本 chunk — value 是 JSON 字符串（带引号）
            const text: string = JSON.parse(valueStr);
            onChunk(text);
            break;
          }
          case '2': {
            // custom data array — 后端通过 dataStream.writeData() 写入的对象
            const dataItems: unknown[] = JSON.parse(valueStr);
            for (const item of dataItems) {
              if (!item || typeof item !== 'object') continue;
              const data = item as Record<string, unknown>;

              switch (data.type) {
                case 'conversation':
                  onConversation?.(data.conversation_id as string);
                  break;
                case 'tool_start':
                  onToolStart?.(
                    data.tool as string,
                    (data.args as Record<string, unknown>) ?? {},
                    (data.message as string) ?? '',
                  );
                  break;
                case 'tool_end':
                  onToolEnd?.(data.tool as string, data.success as boolean);
                  break;
                case 'request_location':
                  onRequestLocation?.(data.request_id as string);
                  break;
              }
            }
            break;
          }
          case 'd': {
            // 流结束 — { finishReason, usage }
            if (!finished) {
              finished = true;
              onDone();
            }
            break;
          }
          case '3': {
            // 错误
            const errorMsg: string = JSON.parse(valueStr);
            if (!finished) {
              finished = true;
              onError(errorMsg);
            }
            break;
          }
          // 8 = message annotations, e = step finish — 忽略
          default:
            break;
        }
      } catch {
        // JSON 解析失败忽略此行
      }
    }
  }

  xhr.open('POST', SSE_URL);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  const cookie = authClient.getCookie();
  if (cookie) xhr.setRequestHeader('Cookie', cookie);
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
      ...(conversationId && { conversation_id: conversationId }),
      ...(requestId && { request_id: requestId }),
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
  const cookie = authClient.getCookie();
  if (cookie) xhr.setRequestHeader('Cookie', cookie);
  xhr.send(JSON.stringify({ request_id: requestId, location }));
}

/** 调用 Gemini Vision 识别消费票据/截图 */
export async function recognizeExpense(
  imageBase64: string,
  mimeType: string,
): Promise<RecognizeResult> {
  const res = await fetch<
    { image: string; mime_type: string },
    { result: RecognizeResult }
  >({
    method: 'POST',
    path: 'ai/recognize/v1',
    body: { image: imageBase64, mime_type: mimeType },
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data.result;
}

// ---------------------------------------------------------------------------
// Conversation CRUD
// ---------------------------------------------------------------------------

/** 获取会话列表 */
export async function fetchConversationList(): Promise<ConversationItem[]> {
  const res = await fetch<Record<string, never>, ConversationItem[]>({
    method: 'POST',
    path: 'ai/conversation/list/v1',
    body: {},
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

/** 获取会话详情（含消息） */
export async function fetchConversationDetail(conversationId: string): Promise<{
  id: string;
  title: string;
  messages: { role: 'user' | 'model'; content: string; created_at: string }[];
}> {
  const res = await fetch<
    { conversation_id: string },
    {
      id: string;
      title: string;
      messages: {
        role: 'user' | 'model';
        content: string;
        created_at: string;
      }[];
    }
  >({
    method: 'POST',
    path: 'ai/conversation/detail/v1',
    body: { conversation_id: conversationId },
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

/** 创建新会话 */
export async function createConversation(
  title?: string,
): Promise<{ id: string; title: string }> {
  const res = await fetch<{ title?: string }, { id: string; title: string }>({
    method: 'POST',
    path: 'ai/conversation/create/v1',
    body: { title },
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

/** 保存被用户中断的 AI 消息 */
export async function saveInterruptedMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<void> {
  const res = await fetch<
    { conversation_id: string; message_id: string; content: string },
    void
  >({
    method: 'POST',
    path: 'ai/conversation/save-interrupted/v1',
    body: { conversation_id: conversationId, message_id: messageId, content },
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
}

/** 删除会话 */
export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const result = await fetch<{ conversation_id: string }, null>({
    method: 'POST',
    path: 'ai/conversation/delete/v1',
    body: { conversation_id: conversationId },
  });

  if (result.success) return;

  const error = result.error ?? '';
  if (error.includes('Conversation not found') || error.includes('(404)')) {
    return;
  }

  throw new Error(error || '删除会话失败');
}

// ---------------------------------------------------------------------------
// Expense API
// ---------------------------------------------------------------------------

/** 上传消费记录 */
export async function uploadExpense(data: {
  amount: number;
  merchant?: string;
  category?: string;
  date?: string;
  items?: string[];
  source: 'camera' | 'album' | 'manual';
  image?: string;
  mime_type?: string;
}): Promise<{ id: string; amount: number }> {
  const body: Record<string, unknown> = {
    amount: data.amount,
    merchant: data.merchant,
    category: data.category,
    date: data.date,
    items: data.items,
    source: data.source,
    image: data.image,
    mime_type: data.mime_type,
  };
  const res = await fetch<
    Record<string, unknown>,
    { id: string; amount: number }
  >({
    method: 'POST',
    path: 'expense/upload/v1',
    body,
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}

/** 获取消费记录列表 */
export async function fetchExpenseList(params?: {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
}): Promise<{
  expenses: Array<{
    id: string;
    amount: number;
    merchant: string | null;
    category: string;
    date: string;
    source: string;
    image_url: string | null;
    created_at: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const res = await fetch<
    Record<string, unknown>,
    {
      expenses: Array<{
        id: string;
        amount: number;
        merchant: string | null;
        category: string;
        date: string;
        source: string;
        image_url: string | null;
        created_at: string;
      }>;
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }
  >({
    method: 'POST',
    path: 'expense/list/v1',
    body: params
      ? {
          page: params.page,
          page_size: params.page_size,
          start_date: params.start_date,
          end_date: params.end_date,
        }
      : {},
  });
  if (!res.success) throw new Error(res.error ?? 'Request failed');
  return res.data;
}
