import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { streamAiChat, postLocationResponse } from '@/services/ai';
import type { AiMessage, ToolCallInfo } from '../types';
import { FLUSH_INTERVAL_MS } from '../consts';
import { useLocation } from './useLocation';

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
  conversationId: string | null;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  requestLocationPermission: (messageId: string) => void;
  loadConversation: (msgs: AiMessage[], convId: string) => void;
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);
  const chunkBufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<RetryPayload | null>(null);

  const { getLocation, wasDenied, resetDenied, requestPermissionAgain } =
    useLocation();

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

  const handleRequestLocation = async (
    aiMsgId: string,
    requestId: string,
  ): Promise<void> => {
    if (wasDenied()) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                locationDeniedHint:
                  '📍 未获取到地理位置信息，推荐的地图应用可能不准确',
                locationRequestId: requestId,
              }
            : m,
        ),
      );
      postLocationResponse(requestId, null);
      return;
    }

    const location = await getLocation();
    if (!location) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                locationDeniedHint:
                  '📍 未获取到地理位置信息，推荐的地图应用可能不准确',
                locationRequestId: requestId,
              }
            : m,
        ),
      );
    }
    postLocationResponse(requestId, location);
  };

  const startStream = (
    history: { role: 'user' | 'model'; content: string }[],
    aiMsgId: string,
  ): void => {
    setIsStreaming(true);
    chunkBufferRef.current = '';
    let hasReceivedChunk = false;

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
      conversationId: conversationId ?? 'new',
      onChunk(chunk) {
        if (!hasReceivedChunk) {
          hasReceivedChunk = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    locationDeniedHint: undefined,
                    locationRequestId: undefined,
                  }
                : m,
            ),
          );
        }
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
      onRequestLocation(requestId) {
        void handleRequestLocation(aiMsgId, requestId);
      },
      onDone(savedConversationId) {
        clearFlushTimer();
        flushChunks();
        retryRef.current = null;
        if (savedConversationId) {
          setConversationId(savedConversationId);
        }
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
    setConversationId(null);
  };

  const requestLocationPermission = (messageId: string): void => {
    const message = messages.find((m) => m.id === messageId);
    const requestId = message?.locationRequestId;
    if (!requestId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, locationDeniedHint: undefined } : m,
      ),
    );

    void (async (): Promise<void> => {
      const location = await requestPermissionAgain();

      if (location) {
        resetDenied();
        postLocationResponse(requestId, location);
      }
    })();
  };

  const loadConversation = (msgs: AiMessage[], convId: string): void => {
    clearFlushTimer();
    chunkBufferRef.current = '';
    retryRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setMessages(msgs);
    setIsStreaming(false);
    setConversationId(convId);
  };

  return {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    clearMessages,
    requestLocationPermission,
    loadConversation,
  };
}
