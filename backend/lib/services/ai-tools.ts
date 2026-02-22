/**
 * Tool Registry — 统一管理 Agent 可用的工具（Vercel AI SDK 版）。
 *
 * 工具参数改用 Zod schema，与 Vercel AI SDK `tool()` 格式对齐。
 *
 * 类比 React Router: 路由统一注册/匹配，Tool Registry 统一注册/执行。
 * AI 模型收到工具定义后，会自主决定何时调用、传什么参数。
 */

import { tool, type CoreTool } from 'ai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 单个工具定义 — 告诉 AI "你能做什么" + 告诉后端 "怎么执行" */
export interface ToolDefinition<TParams extends z.ZodTypeAny = z.ZodTypeAny> {
  /** 工具名称，AI 会用这个名字来调用（如 "get_weather"） */
  name: string;
  /** 工具描述，AI 靠这段话来判断什么时候该用这个工具 */
  description: string;
  /** 参数 Zod Schema — 告诉 AI 该传哪些参数、什么类型，同时运行时类型安全 */
  parameters: TParams;
  /**
   * 实际执行函数。
   * - 普通工具：直接在服务端执行并返回结果
   * - 前端协作式工具（如 get_user_location）：由 stream handler 通过 requestWriteData 注入完成
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (params: z.infer<TParams>, context: ToolContext) => Promise<any>;
  /** 标记此工具是否需要前端协作（不直接执行，需等待前端回传） */
  requiresClientCollaboration?: boolean;
}

/**
 * 工具执行上下文 — 由 stream handler 注入。
 * 普通工具通常不需要用 context；前端协作式工具需要 writeData。
 */
export interface ToolContext {
  /**
   * 向 SSE 数据流写自定义 data part（仅 stream handler 中有效）。
   * 工具外层使用时可为 undefined（如 seed/test 场景）。
   */
  writeData?: (data: unknown) => void;
}

// ---------------------------------------------------------------------------
// ToolRegistry 类
// ---------------------------------------------------------------------------

class ToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools = new Map<string, ToolDefinition<any>>();

  /** 注册一个工具 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(tool: ToolDefinition<any>): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] 工具 "${tool.name}" 已存在，将被覆盖`);
    }
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] 已注册工具: ${tool.name}`);
  }

  /**
   * 导出所有工具，格式化为 Vercel AI SDK 的 `tools` 参数。
   *
   * @param context 注入到每个工具 execute 函数的上下文（含 writeData 等）
   * @returns `Record<string, CoreTool>` — 直接传给 `streamText({ tools: ... })`
   */
  getToolsForAI(context: ToolContext): Record<string, CoreTool> {
    const result: Record<string, CoreTool> = {};

    for (const [name, def] of this.tools.entries()) {
      result[name] = tool({
        description: def.description,
        parameters: def.parameters,
        execute: (params) => def.execute(params, context),
      });
    }

    return result;
  }

  /** 获取指定工具定义（stream handler 中用于特判前端协作工具） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): ToolDefinition<any> | undefined {
    return this.tools.get(name);
  }

  /** 是否有已注册工具 */
  hasTools(): boolean {
    return this.tools.size > 0;
  }

  /** 获取已注册工具名列表（调试用） */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// ---------------------------------------------------------------------------
// 单例导出 — 整个后端共享一个 Registry
// ---------------------------------------------------------------------------

// 用全局变量保存实例，防止开发模式热重载时重复创建
const globalForTools = globalThis as unknown as {
  __toolRegistry?: ToolRegistry;
};

if (!globalForTools.__toolRegistry) {
  globalForTools.__toolRegistry = new ToolRegistry();
}

export const toolRegistry = globalForTools.__toolRegistry;
