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
}

/** SSE event data shapes. */
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
