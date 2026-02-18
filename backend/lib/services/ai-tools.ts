/**
 * Tool Registry — 统一管理 Agent 可用的工具。
 *
 * 类比 React Router: 路由统一注册/匹配，Tool Registry 也是工具统一注册/执行。
 * AI 模型收到工具定义后，会自主决定何时调用、传什么参数。
 */

import type { FunctionDeclarationSchema, Tool } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 单个工具的定义 —— 告诉 AI "你能做什么" + 告诉后端 "怎么执行" */
export interface ToolDefinition<
  TParams = Record<string, unknown>,
  TResult = unknown,
> {
  /** 工具名称，AI 会用这个名字来调用（如 "get_weather"） */
  name: string;
  /** 工具描述，AI 靠这段话来判断什么时候该用这个工具 */
  description: string;
  /** 参数 JSON Schema —— 告诉 AI 该传哪些参数、什么类型 */
  parameters: FunctionDeclarationSchema;
  /** 实际执行函数 —— 拿到 AI 传的参数，返回结果 */
  execute: (params: TParams) => Promise<TResult>;
}

/** 工具执行结果 */
export interface ToolExecutionResult {
  /** 工具名称 */
  name: string;
  /** 执行是否成功 */
  success: boolean;
  /** 成功时的返回数据 */
  data?: unknown;
  /** 失败时的错误信息 */
  error?: string;
}

// ---------------------------------------------------------------------------
// ToolRegistry 类
// ---------------------------------------------------------------------------

class ToolRegistry {
  // 用 Map 存储工具，O(1) 查找 —— 类似你在前端用 Map 缓存组件实例
  private tools = new Map<string, ToolDefinition>();

  /** 注册一个工具（接受任意参数/返回类型的工具定义） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(tool: ToolDefinition<any, any>): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] 工具 "${tool.name}" 已存在，将被覆盖`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * 导出所有工具的 schema，传给 Gemini。
   *
   * 就像 React Router 的 `routes` 配置数组 —— 你注册了哪些路由，Router 就渲染哪些页面。
   * 这里注册了哪些工具，AI 就能调用哪些工具。
   */
  getToolDeclarations(): Tool[] {
    const functionDeclarations = Array.from(this.tools.values()).map(
      (tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }),
    );

    // Gemini 要求 tools 数组里的每个元素是 { functionDeclarations: [...] }
    return [{ functionDeclarations }];
  }

  /**
   * 执行一个工具调用。
   *
   * AI 说 "我要调用 get_weather({ city: '杭州' })"，Registry 就找到对应工具并执行。
   */
  async execute(
    name: string,
    params: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        name,
        success: false,
        error: `未知工具: ${name}`,
      };
    }

    try {
      const data = await tool.execute(params);
      return { name, success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '工具执行失败';
      console.error(`[ToolRegistry] 工具 "${name}" 执行失败:`, err);
      return { name, success: false, error: message };
    }
  }

  /** 检查是否有注册的工具 */
  hasTools(): boolean {
    return this.tools.size > 0;
  }

  /** 获取已注册的工具名列表（调试用） */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// ---------------------------------------------------------------------------
// 单例导出 —— 整个后端共享一个 Registry
// ---------------------------------------------------------------------------

// 用全局变量保存实例，防止 Next.js 热更新时重复创建
const globalForTools = globalThis as unknown as {
  __toolRegistry?: ToolRegistry;
};

if (!globalForTools.__toolRegistry) {
  globalForTools.__toolRegistry = new ToolRegistry();
}

export const toolRegistry = globalForTools.__toolRegistry;
