/**
 * AI 服务 — Gemini 接入层。
 *
 * 模块 1: 纯聊天 (streamChat)
 * 模块 2: 新增 Tool Calling + ReAct 循环 (streamChatWithTools)
 *
 * ReAct 循环 = Reasoning + Acting，AI 交替思考和行动：
 *   1. AI 收到消息 + 工具定义
 *   2. AI 决定是直接回答 还是 调用工具
 *   3. 如果调用工具 → 执行工具 → 把结果送回 AI → 回到第 2 步
 *   4. 如果直接回答 → 流式输出文本 → 结束
 */

import {
  GoogleGenerativeAI,
  type Content,
  type GenerateContentStreamResult,
  type Part,
} from '@google/generative-ai';
import type { ChatMessage } from '@/types/ai';
import { toolRegistry } from './ai-tools';

// 注册所有工具 —— import 时会自动执行 register()
import './tools/get-weather';

// ---------------------------------------------------------------------------
// Gemini client 单例（和模块 1 一样，防止热更新重复创建）
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
// Model 配置
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * 从 ai-prompt.json 构建 system instruction。
 * 新增工具或修改 AI 行为时，直接改 JSON 文件即可，不用动这里。
 */
import promptConfig from './ai-prompt.json';

function buildSystemInstruction(): string {
  const lines: string[] = [
    promptConfig.role,
    promptConfig.language,
    '',
    '你拥有以下能力：',
    ...promptConfig.capabilities.map((c) => `- ${c}`),
    '',
  ];

  for (const tool of Object.values(promptConfig.toolGuidelines)) {
    lines.push(tool.instruction);
    for (const hint of Object.values(tool.routing)) {
      lines.push(`- ${hint}`);
    }
  }

  lines.push(promptConfig.outputStyle);
  return lines.join('\n');
}

const SYSTEM_INSTRUCTION = buildSystemInstruction();

/** ReAct 循环最大步数 —— 防止无限循环 */
const MAX_REACT_STEPS = 5;

// ---------------------------------------------------------------------------
// 工具调用回调（用于 SSE 实时推送工具状态给前端）
// ---------------------------------------------------------------------------

/** 工具名 → 前端展示文案 */
const TOOL_STATUS_MESSAGES: Record<string, string> = {
  get_weather: '正在查询天气...',
  search_attractions: '正在搜索景点...',
  plan_route: '正在规划路线...',
  recognize_payment: '正在识别票据...',
};

function getToolStatusMessage(toolName: string): string {
  return TOOL_STATUS_MESSAGES[toolName] ?? `正在执行 ${toolName}...`;
}

/** 工具调用过程中的回调，让路由层能实时推送状态给前端 */
export interface ToolCallbacks {
  onToolStart: (
    toolName: string,
    args: Record<string, unknown>,
    message: string,
  ) => void;
  onToolEnd: (toolName: string, success: boolean) => void;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * [模块 1] 纯聊天流式输出（保持向后兼容）
 */
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

/**
 * [模块 2] 带 Tool Calling 的聊天 —— ReAct 循环。
 *
 * 和 streamChat 的区别：
 * - streamChat: AI 直接回答，一轮就结束
 * - streamChatWithTools: AI 可能要调用工具，多轮交互后才回答
 *
 * 返回的是最终回答的流式结果，中间的工具调用通过 callbacks 回传。
 */
export async function streamChatWithTools(
  messages: ChatMessage[],
  callbacks: ToolCallbacks,
): Promise<GenerateContentStreamResult> {
  const client = getGeminiClient();

  // 把工具定义传给模型 —— 告诉 AI "你有这些超能力"
  const tools = toolRegistry.getToolDeclarations();

  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools,
  });

  // 构建对话历史（和模块 1 一样）
  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('Last message must be from user');
  }

  const chat = model.startChat({ history });

  // ── ReAct 循环 ─────────────────────────────────────────────────────
  //
  // 循环逻辑：
  //   1. 发消息给 AI（非流式，因为需要检查是否有 tool call）
  //   2. 如果 AI 返回 tool call → 执行工具 → 把结果加入历史 → 继续循环
  //   3. 如果 AI 返回纯文本 → 跳出循环，用流式输出最终回答
  //
  // 为什么中间步骤用非流式？
  //   因为 tool call 的响应不是文本，而是结构化的函数调用指令。
  //   只有最终回答才需要流式（给用户看打字效果）。

  let currentMessage: string | Part[] = lastMessage.content;

  console.log(`[AI]   ReAct 开始 (最多 ${MAX_REACT_STEPS} 步)`);

  for (let step = 0; step < MAX_REACT_STEPS; step++) {
    const tStep = Date.now();
    console.log(`[AI]   ── Step ${step + 1} ── 发送消息给 Gemini...`);

    const response = await chat.sendMessage(currentMessage);
    const candidate = response.response.candidates?.[0];

    if (!candidate) {
      throw new Error('Gemini 返回空结果');
    }

    const functionCalls = candidate.content.parts.filter(
      (
        part,
      ): part is Part & {
        functionCall: { name: string; args: Record<string, unknown> };
      } => 'functionCall' in part,
    );

    const textParts = candidate.content.parts
      .filter((p): p is Part & { text: string } => 'text' in p)
      .map((p) => p.text);

    if (textParts.length > 0) {
      const preview = textParts.join('').slice(0, 100);
      console.log(
        `[AI]   Step ${step + 1}: AI 返回文本 (${Date.now() - tStep}ms) "${preview}..."`,
      );
    }

    if (functionCalls.length === 0) {
      console.log(`[AI]   Step ${step + 1}: 无工具调用 → 直接输出最终回答`);
      return createStreamFromText(textParts.join(''));
    }

    console.log(
      `[AI]   Step ${step + 1}: AI 要求调用 ${functionCalls.length} 个工具 (${Date.now() - tStep}ms)`,
    );

    const functionResponseParts: Part[] = [];

    for (const fc of functionCalls) {
      const { name, args } = fc.functionCall;

      console.log(`[AI]   🔧 调用工具: ${name}(${JSON.stringify(args)})`);
      callbacks.onToolStart(name, args, getToolStatusMessage(name));

      const tTool = Date.now();
      const result = await toolRegistry.execute(name, args);
      const elapsed = Date.now() - tTool;

      if (result.success) {
        const dataPreview = JSON.stringify(result.data).slice(0, 200);
        console.log(
          `[AI]   ✓ ${name} 成功 (${elapsed}ms) → ${dataPreview}${JSON.stringify(result.data).length > 200 ? '...' : ''}`,
        );
      } else {
        console.log(`[AI]   ✗ ${name} 失败 (${elapsed}ms) → ${result.error}`);
      }

      callbacks.onToolEnd(name, result.success);

      functionResponseParts.push({
        functionResponse: {
          name,
          response: result.success
            ? { result: result.data }
            : { error: result.error },
        },
      });
    }

    currentMessage = functionResponseParts;
    console.log(`[AI]   Step ${step + 1} 完成，把工具结果送回 AI...`);
  }

  console.log(`[AI]   ⚠ 达到最大步数 (${MAX_REACT_STEPS})，强制结束`);
  return createStreamFromText('抱歉，处理过程过于复杂，请尝试简化你的问题。');
}

// ---------------------------------------------------------------------------
// 辅助：把普通文本包装成 GenerateContentStreamResult 的形式
// ---------------------------------------------------------------------------

/** 每个模拟 chunk 的大小（字符数） */
const SIMULATED_CHUNK_SIZE = 18;
/** 模拟 chunk 之间的延迟（毫秒） */
const SIMULATED_CHUNK_DELAY_MS = 16;

/**
 * 为什么需要这个？
 *
 * ReAct 循环中，中间步骤用非流式 API 和 AI 交互（因为要检查 tool call）。
 * 但最终回答需要以"流式"形式返回给路由层（SSE 推送给前端）。
 *
 * 这个函数把一段文本拆成小块（~18 字符/块），每块之间加 16ms 延迟，
 * 模拟真实的流式输出效果。路由层的 for-await 会逐块收到文本，
 * 每块触发一个 SSE chunk 事件，前端就能看到打字效果了。
 */
function createStreamFromText(text: string): GenerateContentStreamResult {
  // 把文本拆成小块
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += SIMULATED_CHUNK_SIZE) {
    chunks.push(text.slice(i, i + SIMULATED_CHUNK_SIZE));
  }

  let index = 0;

  const stream = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (index >= chunks.length) {
            return { done: true as const, value: undefined };
          }
          // 第一块立即返回，后续块加延迟
          if (index > 0) {
            await new Promise((r) => setTimeout(r, SIMULATED_CHUNK_DELAY_MS));
          }
          const chunk = chunks[index++]!;
          return {
            done: false as const,
            value: { text: () => chunk },
          };
        },
      };
    },
  };

  return {
    stream,
    response: Promise.resolve({
      text: () => text,
      candidates: [
        {
          content: { role: 'model', parts: [{ text }] },
        },
      ],
    }),
  } as unknown as GenerateContentStreamResult;
}
