/** Message role in the AI chat. */
export type AiRole = 'user' | 'assistant';

/** A single message in the AI conversation. */
export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: number;
  /** True while the model is still streaming tokens. */
  isStreaming?: boolean;
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

export type SseEvent = SseChunkEvent | SseDoneEvent | SseErrorEvent;

/** Copywriting / text content for the AI chat page (from backend). */
export interface AiCopywriting {
  headerTitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  inputPlaceholder: string;
}
