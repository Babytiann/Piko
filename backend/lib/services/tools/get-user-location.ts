/**
 * 获取用户地理位置工具 —— 一个"前端协作式"工具。
 *
 * 和 get_weather / plan_route 不同，这个工具后端无法直接执行
 * （位置在用户设备上），需要前端配合：
 *   1. AI 调用 get_user_location
 *   2. 后端发 SSE request_location 事件给前端
 *   3. 前端用 expo-location 获取位置，POST 回传
 *   4. 后端拿到位置后作为工具结果喂回 AI
 *
 * 所以这里的 execute 永远不会被 ToolRegistry 直接调用，
 * 真正的处理逻辑在 stream-chat-with-tools.ts 中特殊分支。
 */

import { SchemaType } from '@google/generative-ai';
import { toolRegistry, type ToolDefinition } from '../ai-tools';

interface GetUserLocationParams {
  reason?: string;
}

interface UserLocationResult {
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
}

const getUserLocationTool: ToolDefinition<
  GetUserLocationParams,
  UserLocationResult
> = {
  name: 'get_user_location',
  description: [
    '获取用户当前的地理位置（经纬度、国家、城市）。',
    '',
    '使用场景：',
    '- 用户询问出行路线、旅游攻略、导航相关问题时，需要知道用户所在区域',
    '- 需要判断用户在中国境内还是海外，以决定使用高德地图还是 Google Maps',
    '',
    '注意：',
    '- 这是一个需要用户授权的工具，用户可能拒绝提供位置',
    '- 如果用户拒绝，你仍然可以正常回答，但无法确定使用哪个地图应用',
    '- 位置信息不会被缓存，每次需要时都会重新请求',
    '- 应当与 plan_route 等工具在同一轮中调用',
  ].join('\n'),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      reason: {
        type: SchemaType.STRING,
        description: '简要说明为什么需要获取位置（如"判断使用哪个地图应用"）',
      },
    },
    required: [],
  },
  // 占位 —— 实际永远不会通过 ToolRegistry.execute 调用
  execute: async () => {
    throw new Error(
      'get_user_location 不能直接执行，需要通过 SSE 前端协作流程',
    );
  },
};

toolRegistry.register(getUserLocationTool);

export { getUserLocationTool };
