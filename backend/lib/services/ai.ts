import {
  GoogleGenerativeAI,
  type GenerateContentStreamResult,
} from '@google/generative-ai';
import type { ChatMessage } from '@/types/ai';

// ---------------------------------------------------------------------------
// Gemini client singleton (survives Next.js dev-mode hot reloads)
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

const globalForAi = globalThis as unknown as {
  __geminiClient?: GoogleGenerativeAI;
};

function getGeminiClient(): GoogleGenerativeAI {
  if (!globalForAi.__geminiClient) {
    globalForAi.__geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return globalForAi.__geminiClient;
}

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-3-flash-preview';

/** System instruction injected into every conversation. */
const SYSTEM_INSTRUCTION = [
  '你是智能助手，一个友好、专业的 AI 伙伴。',
  '用简洁的中文回答用户问题，必要时使用 Markdown 格式。',
  '如果用户使用英文提问，你也可以用英文回答。',
].join('\n');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start a streaming chat with Gemini.
 *
 * @param messages - Conversation history (user/model turns).
 * @returns An async iterable of text chunks from the model.
 */
export async function streamChat(
  messages: ChatMessage[],
): Promise<GenerateContentStreamResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // Split history (all but last) and the current user message
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
