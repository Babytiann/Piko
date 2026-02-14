import { useCallback, useRef, useState } from 'react';
import { streamAiChat } from '@/services/ai';
import type { AiMessage } from '../types';

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

      const history = [...messages, userMsg].map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

      cleanupRef.current = streamAiChat({
        messages: history,
        onChunk(chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
        onDone() {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, isStreaming: false } : m,
            ),
          );
          setIsStreaming(false);
          cleanupRef.current = null;
        },
        onError(error) {
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
    cleanupRef.current?.();
    cleanupRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
