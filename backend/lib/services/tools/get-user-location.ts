/**
 * 获取用户地理位置工具 — 一个"前端协作式"工具（Vercel AI SDK 版）。
 *
 * 和 get_weather / plan_route 不同，这个工具后端无法直接执行
 * （设备位置在用户手机上），需要前端配合：
 *   1. AI 调用 get_user_location → execute() 被触发
 *   2. execute() 通过 context.writeData 写 request_location 数据部分
 *   3. 前端收到 data part 后调用 expo-location 获取 GPS
 *   4. 前端 POST /piko/ai/location/v1 回传位置
 *   5. LocationBridge.resolveLocationRequest 唤醒挂起的 Promise
 *   6. execute() 拿到位置结果，返回给 streamText 作为工具结果
 */

import { z } from 'zod';
import { createLocationRequest } from '../location-bridge';
import { toolRegistry, type ToolDefinition } from '../ai-tools';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const parametersSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe('简要说明为什么需要获取位置（如"判断使用哪个地图应用"）'),
});

// ---------------------------------------------------------------------------
// 工具定义 & 注册
// ---------------------------------------------------------------------------

const getUserLocationTool: ToolDefinition<typeof parametersSchema> = {
  name: 'get_user_location',
  requiresClientCollaboration: true,
  description: [
    '获取用户当前的地理位置（经纬度）。',
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
  parameters: parametersSchema,
  execute: async (params, context) => {
    if (!context.writeData) {
      // 非 SSE 场景（如单元测试）直接抛出，调用方应 mock 此工具
      throw new Error(
        '[get_user_location] context.writeData 未注入，无法发起位置请求',
      );
    }

    const { requestId, promise } = createLocationRequest();

    // 向前端数据流写 custom data part，前端据此触发 GPS 采集
    context.writeData({
      type: 'request_location',
      requestId,
      reason: params.reason ?? '获取当前位置',
    });

    const location = await promise;

    if (!location) {
      return {
        error: '用户拒绝提供位置或请求超时',
        latitude: null,
        longitude: null,
      };
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  },
};

toolRegistry.register(getUserLocationTool);

export { getUserLocationTool };
