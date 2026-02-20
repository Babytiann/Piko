/**
 * Gemini client 单例 + model 配置。
 *
 * 用全局变量保存实例，防止 Next.js 热更新时重复创建。
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import promptConfig from '../ai-prompt.json';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

const globalForAi = globalThis as unknown as {
  __geminiClient?: GoogleGenerativeAI;
};

export function getGeminiClient(): GoogleGenerativeAI {
  if (!globalForAi.__geminiClient) {
    globalForAi.__geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return globalForAi.__geminiClient;
}

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

  for (const tool of Object.values(promptConfig.toolGuidelines)) {
    lines.push(tool.instruction);
    for (const hint of Object.values(tool.routing)) {
      lines.push(`- ${hint}`);
    }
    if ('outputRule' in tool && typeof tool.outputRule === 'string') {
      lines.push(tool.outputRule);
    }
  }

  lines.push(promptConfig.outputStyle);
  return lines.join('\n');
}

export const SYSTEM_INSTRUCTION = buildSystemInstruction();
