/** Types for AI chat SSE streaming. */

/** Role of a message participant. */
export type MessageRole = 'user' | 'model';

/** A single message in the conversation history. */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Request body for POST /piko/ai/chat/v1 */
export interface AiChatRequest {
  messages: ChatMessage[];
  /** 对话 ID。"new" 或不传 = 新建对话，已有值 = 追加到现有对话 */
  conversation_id?: string;
  /** 客户端请求 ID（用于重连幂等） */
  request_id?: string;
}

export interface SseConversationEvent {
  type: 'conversation';
  conversation_id: string;
}

/** SSE event data shapes. */
export interface SseChunkEvent {
  type: 'chunk';
  content: string;
}

export interface SseDoneEvent {
  type: 'done';
  /** 对话 ID（新建对话时返回给前端） */
  conversation_id?: string;
}

export interface SseErrorEvent {
  type: 'error';
  message: string;
}

/** [模块 2] Agent 开始调用工具 */
export interface SseToolStartEvent {
  type: 'tool_start';
  tool: string;
  args: Record<string, unknown>;
  /** 前端展示的状态文案，如 "正在查询天气..." */
  message: string;
}

/** [模块 2] Agent 工具调用结束 */
export interface SseToolEndEvent {
  type: 'tool_end';
  tool: string;
  success: boolean;
}

/** 请求前端获取用户地理位置 */
export interface SseRequestLocationEvent {
  type: 'request_location';
  /** 用于关联位置回传的唯一请求 ID */
  request_id: string;
}

export type SseEvent =
  | SseChunkEvent
  | SseDoneEvent
  | SseErrorEvent
  | SseToolStartEvent
  | SseToolEndEvent
  | SseRequestLocationEvent
  | SseConversationEvent;

/** Page data for the AI chat page. */
export interface AiPageData {
  /** Page header title, e.g. "AI 助手" */
  header_title: string;
  /** Empty-state greeting title, e.g. "Hi，我是 Piko AI" */
  empty_title: string;
  /** Empty-state subtitle, e.g. "问我任何问题，我会尽力帮你解答。" */
  empty_subtitle: string;
  /** Input placeholder, e.g. "问我任何问题..." */
  input_placeholder: string;
  /** Conversation drawer title, e.g. "历史对话" */
  drawer_title: string;
  /** New chat button label in drawer, e.g. "新对话" */
  new_chat_label: string;
}
