import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { streamAiChat } from '@/services/ai';
import type { AiMessage, ToolCallInfo } from '../types';

const FLUSH_INTERVAL_MS = 48;

let nextId = 0;
function genId(): string {
  nextId += 1;
  return `msg_${Date.now()}_${nextId}`;
}

interface RetryPayload {
  history: { role: 'user' | 'model'; content: string }[];
  aiMsgId: string;
}

interface UseAiChatReturn {
  messages: AiMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);
  const chunkBufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<RetryPayload | null>(null);

  const clearFlushTimer = (): void => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  };

  const handleToolStart = (
    aiMsgId: string,
    tool: string,
    args: Record<string, unknown>,
    message: string,
  ): void => {
    const toolCall: ToolCallInfo = { tool, args, message, loading: true };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== aiMsgId) return m;
        const existing = m.toolCalls ?? [];
        return {
          ...m,
          toolCalls: [...existing, toolCall],
          statusText: message,
        };
      }),
    );
  };

  const handleToolEnd = (
    aiMsgId: string,
    tool: string,
    success: boolean,
  ): void => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== aiMsgId) return m;
        const updated = (m.toolCalls ?? []).map((tc) =>
          tc.tool === tool && tc.loading
            ? { ...tc, loading: false, success }
            : tc,
        );
        return { ...m, toolCalls: updated };
      }),
    );
  };

  const startStream = (
    history: { role: 'user' | 'model'; content: string }[],
    aiMsgId: string,
  ): void => {
    setIsStreaming(true);
    chunkBufferRef.current = '';

    const flushChunks = (): void => {
      const buffered = chunkBufferRef.current;
      if (!buffered) return;
      chunkBufferRef.current = '';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: m.content + buffered, statusText: undefined }
            : m,
        ),
      );
    };

    cleanupRef.current = streamAiChat({
      messages: history,
      onChunk(chunk) {
        chunkBufferRef.current += chunk;
        if (!flushTimerRef.current) {
          flushTimerRef.current = setTimeout(() => {
            flushTimerRef.current = null;
            flushChunks();
          }, FLUSH_INTERVAL_MS);
        }
      },
      onToolStart(tool, args, message) {
        handleToolStart(aiMsgId, tool, args, message);
      },
      onToolEnd(tool, success) {
        handleToolEnd(aiMsgId, tool, success);
      },
      onDone() {
        clearFlushTimer();
        flushChunks();
        retryRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m,
          ),
        );
        setIsStreaming(false);
        cleanupRef.current = null;
      },
      onError(error) {
        clearFlushTimer();
        flushChunks();

        if (AppState.currentState !== 'active') {
          retryRef.current = { history, aiMsgId };
          return;
        }

        retryRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: m.content || `⚠ ${error}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
        setIsStreaming(false);
        cleanupRef.current = null;
      },
    });
  };

  const startStreamRef = useRef(startStream);
  startStreamRef.current = startStream;

  useEffect(() => {
    const handleAppState = (state: AppStateStatus): void => {
      if (state !== 'active' || !retryRef.current) return;

      const { history, aiMsgId } = retryRef.current;
      retryRef.current = null;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: '', isStreaming: true, toolCalls: undefined }
            : m,
        ),
      );
      startStreamRef.current(history, aiMsgId);
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const sendMessage = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: AiMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const aiMsgId = genId();
    const aiMsg: AiMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    const history = [...messages, userMsg].map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      content: m.content,
    }));

    startStream(history, aiMsgId);
  };

  const clearMessages = (): void => {
    clearFlushTimer();
    chunkBufferRef.current = '';
    retryRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  };

  return { messages, isStreaming, sendMessage, clearMessages };
}
