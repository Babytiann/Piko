/** 工具调用过程中的回调，让路由层能实时推送状态给前端 */
export interface ToolCallbacks {
  onToolStart: (
    toolName: string,
    args: Record<string, unknown>,
    message: string,
  ) => void;
  onToolEnd: (toolName: string, success: boolean) => void;
  /** 前端协作式工具：请求获取用户地理位置，返回位置数据或 null */
  onRequestLocation: () => Promise<{
    latitude: number;
    longitude: number;
  } | null>;
}

/** 工具名 → 前端展示文案 */
const TOOL_STATUS_MESSAGES: Record<string, string> = {
  get_weather: '正在查询天气...',
  search_attractions: '正在搜索景点...',
  plan_route: '正在规划路线...',
  recognize_payment: '正在识别票据...',
  get_user_location: '正在获取你的位置...',
};

export function getToolStatusMessage(toolName: string): string {
  return TOOL_STATUS_MESSAGES[toolName] ?? `正在执行 ${toolName}...`;
}
