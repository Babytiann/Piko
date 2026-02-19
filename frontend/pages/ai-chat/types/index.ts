/** Message role in the AI chat. */
export type AiRole = 'user' | 'assistant';

/** [模块 2] 工具调用状态 */
export interface ToolCallInfo {
  /** 工具名称（如 "get_weather"） */
  tool: string;
  /** 调用参数 */
  args: Record<string, unknown>;
  /** 后端下发的状态文案（如 "正在查询天气..."） */
  message: string;
  /** 是否正在执行中 */
  loading: boolean;
  /** 执行是否成功（完成后才有值） */
  success?: boolean;
}

/** A single message in the AI conversation. */
export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: number;
  /** True while the model is still streaming tokens. */
  isStreaming?: boolean;
  /** [模块 2] 该消息关联的工具调用记录 */
  toolCalls?: ToolCallInfo[];
  /** 工具执行期间持续展示的状态文案，非空时一直显示，直到第一个 chunk 到来才清除 */
  statusText?: string;
}

/** 长按消息时通过 measureInWindow 测量的屏幕坐标 */
export interface BubbleLayout {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

/** Tooltip 弹出时需要的完整信息 */
export interface TooltipTarget {
  message: AiMessage;
  layout: BubbleLayout;
}

/** SSE event shapes sent by the backend. */
export interface SseChunkEvent {
  type: 'chunk';
  content: string;
}

export interface SseDoneEvent {
  type: 'done';
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
  /** 后端下发的状态文案 */
  message: string;
}

/** [模块 2] Agent 工具调用结束 */
export interface SseToolEndEvent {
  type: 'tool_end';
  tool: string;
  success: boolean;
}

export type SseEvent =
  | SseChunkEvent
  | SseDoneEvent
  | SseErrorEvent
  | SseToolStartEvent
  | SseToolEndEvent;

export type MarkdownSegment =
  | { type: 'markdown'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'amap-navigation'; url: string; label: string };

/** Copywriting / text content for the AI chat page (from backend). */
export interface AiCopywriting {
  headerTitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  inputPlaceholder: string;
}
