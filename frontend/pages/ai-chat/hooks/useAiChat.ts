import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { streamAiChat } from '@/services/ai';
import type { AiMessage } from '../types';

const FLUSH_INTERVAL_MS = 48;

let nextId = 0;
function genId(): string {
  nextId += 1;
  return `msg_${Date.now()}_${nextId}`;
}

/** 后台中断时保存的重试信息 */
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

  const clearFlushTimer = useCallback((): void => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  // 核心：启动一个 streaming 会话，可被 sendMessage 和 AppState 重试共用
  const startStream = useCallback(
    (
      history: { role: 'user' | 'model'; content: string }[],
      aiMsgId: string,
    ) => {
      setIsStreaming(true);
      chunkBufferRef.current = '';

      const flushChunks = (): void => {
        const buffered = chunkBufferRef.current;
        if (!buffered) return;
        chunkBufferRef.current = '';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: m.content + buffered } : m,
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

          // iOS 会在后台挂起网络 —— 如果此刻不在前台，标记重试而非报错
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
    },
    [clearFlushTimer],
  );

  // 监听 App 前后台切换，回到前台时自动重试被中断的请求
  useEffect(() => {
    const handleAppState = (state: AppStateStatus): void => {
      if (state !== 'active' || !retryRef.current) return;

      const { history, aiMsgId } = retryRef.current;
      retryRef.current = null;

      // 清空已收到的部分内容，重新请求完整响应
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: '', isStreaming: true } : m,
        ),
      );
      startStream(history, aiMsgId);
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [startStream]);

  const sendMessage = useCallback(
    (text: string) => {
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
    },
    [messages, isStreaming, startStream],
  );

  const clearMessages = useCallback(() => {
    clearFlushTimer();
    chunkBufferRef.current = '';
    retryRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, [clearFlushTimer]);

  return { messages, isStreaming, sendMessage, clearMessages };
}
