/**
 * POST /piko/ai/location/v1
 *
 * 前端回传用户地理位置数据。
 * 与 SSE 流中的 request_location 事件配合使用：
 *   SSE → 前端收到 request_location(requestId)
 *   前端 → POST 此端点 { requestId, location }
 *   后端 → 通过 locationBridge 将数据传给等待中的 ReAct 循环
 */

import { NextRequest } from 'next/server';
import { resolveLocationRequest } from '@/lib/services/location-bridge';

interface LocationResponseBody {
  requestId: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export async function POST(request: NextRequest) {
  let body: LocationResponseBody;
  try {
    body = (await request.json()) as LocationResponseBody;
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.requestId) {
    return Response.json(
      { success: false, error: 'requestId is required' },
      { status: 400 },
    );
  }

  const resolved = resolveLocationRequest(body.requestId, body.location);

  if (!resolved) {
    return Response.json(
      { success: false, error: 'Request not found or timed out' },
      { status: 404 },
    );
  }

  return Response.json({ success: true });
}
