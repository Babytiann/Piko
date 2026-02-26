import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { LanguageModel } from 'ai';

import promptConfig from '../ai-prompt.json' with { type: 'json' };

const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

const DEFAULT_OPENROUTER_MODEL_ID = 'arcee-ai/trinity-large-preview:free';

const globalForAi = globalThis as unknown as {
  __googleProvider?: ReturnType<typeof createGoogleGenerativeAI>;
  __openRouterProvider?: ReturnType<typeof createOpenRouter>;
};

function getGoogleProvider(): ReturnType<typeof createGoogleGenerativeAI> {
  if (!globalForAi.__googleProvider) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[AI] GEMINI_API_KEY 环境变量未配置');
    }
    globalForAi.__googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return globalForAi.__googleProvider;
}

function getOpenRouterProvider(): ReturnType<typeof createOpenRouter> {
  if (!globalForAi.__openRouterProvider) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('[AI] OPENROUTER_API_KEY 环境变量未配置');
    }
    globalForAi.__openRouterProvider = createOpenRouter({
      apiKey,
    });
  }
  return globalForAi.__openRouterProvider;
}

export function getModel(): LanguageModel {
  /*if (process.env.OPENROUTER_API_KEY) {
    const modelId =
      process.env.OPENROUTER_MODEL_ID ?? DEFAULT_OPENROUTER_MODEL_ID;
    return getOpenRouterProvider().chat(modelId) as LanguageModel;
  }*/
  return getGoogleProvider()(DEFAULT_MODEL_ID);
}

// ---------------------------------------------------------------------------
// System Instruction 构建
// ---------------------------------------------------------------------------

/**
 * 从 ai-prompt.json 构建 system instruction。
 * 新增工具或修改 AI 行为时，直接改 JSON 文件即可，不用动这里。
 */
function buildSystemInstruction(): string {
  const lines: string[] = [
    promptConfig.role,
    promptConfig.language,
    '',
    '你拥有以下能力：',
    ...promptConfig.capabilities.map((c) => `- ${c}`),
    '',
  ];

  for (const toolGuideline of Object.values(promptConfig.toolGuidelines)) {
    lines.push(toolGuideline.instruction);
    for (const hint of Object.values(toolGuideline.routing)) {
      lines.push(`- ${hint}`);
    }
    if (
      'outputRule' in toolGuideline &&
      typeof toolGuideline.outputRule === 'string'
    ) {
      lines.push(toolGuideline.outputRule);
    }
  }

  lines.push(promptConfig.outputStyle);
  return lines.join('\n');
}

export const SYSTEM_INSTRUCTION = buildSystemInstruction();
