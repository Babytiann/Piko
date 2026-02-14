import { useCallback, useRef, useState } from 'react';
import { streamAiChat } from '@/services/ai';
import type { AiMessage } from '../types';

const FLUSH_INTERVAL_MS = 48;

let nextId = 0;
function genId(): string {
  nextId += 1;
  return `msg_${Date.now()}_${nextId}`;
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

      const clearFlushTimer = (): void => {
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
      };

      const history = [...messages, userMsg].map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

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
    [messages, isStreaming],
  );

  const clearMessages = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    chunkBufferRef.current = '';
    cleanupRef.current?.();
    cleanupRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
