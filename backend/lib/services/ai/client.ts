/**
 * AI 模型配置 — 使用 Vercel AI SDK (@ai-sdk/google)。
 *
 * 替换原有的 @google/generative-ai 直接调用，
 * 统一由 Vercel AI SDK 管理 provider 和模型实例。
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import promptConfig from '../ai-prompt.json';

// ---------------------------------------------------------------------------
// 模型配置
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash';

/**
 * 获取 Google Gemini 模型实例。
 * 用全局变量缓存 provider，避免开发模式热重载时重复初始化。
 */
const globalForAi = globalThis as unknown as {
  __googleProvider?: ReturnType<typeof createGoogleGenerativeAI>;
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

export function getModel(): LanguageModel {
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
