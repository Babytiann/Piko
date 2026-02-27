const TOOL_STATUS_MESSAGES: Record<string, string> = {
  get_weather: '正在查询天气...',
  plan_route: '正在规划路线...',
  get_user_location: '正在获取你的位置...',
};

export function getToolStatusMessage(toolName: string): string {
  return TOOL_STATUS_MESSAGES[toolName] ?? `正在执行 ${toolName}...`;
}
