/** [模块 1] 纯聊天流式输出（保持向后兼容） */

import type { GenerateContentStreamResult } from '@google/generative-ai';
import type { ChatMessage } from '@/types/ai';
import { getGeminiClient, DEFAULT_MODEL, SYSTEM_INSTRUCTION } from './client';

export async function streamChat(
  messages: ChatMessage[],
): Promise<GenerateContentStreamResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('Last message must be from user');
  }

  const chat = model.startChat({ history });
  return chat.sendMessageStream(lastMessage.content);
}
