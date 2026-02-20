/**
 * Location Bridge —— SSE 请求和前端位置回传之间的桥梁。
 *
 * SSE 是单向通道（服务端→客户端），前端无法通过 SSE 回传数据。
 * 这个模块用 in-memory Map 关联两者：
 *   1. SSE 流发 request_location 时，创建一个 Promise 并存入 Map
 *   2. 前端收到事件后发 POST /piko/ai/location/v1 回传位置
 *   3. POST handler 用 requestId 找到对应 resolve，将数据传给 ReAct 循环
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
}

interface PendingRequest {
  resolve: (location: UserLocation | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** 等待前端回传的超时时间 */
const LOCATION_TIMEOUT_MS = 15_000;

const globalForBridge = globalThis as unknown as {
  __locationBridge?: Map<string, PendingRequest>;
};

if (!globalForBridge.__locationBridge) {
  globalForBridge.__locationBridge = new Map();
}

const pendingRequests = globalForBridge.__locationBridge;

let nextRequestId = 0;

/**
 * 创建位置请求 —— 返回 requestId 和一个等待位置的 Promise。
 * SSE 流把 requestId 发给前端，前端回传时用这个 id 匹配。
 */
export function createLocationRequest(): {
  requestId: string;
  promise: Promise<UserLocation | null>;
} {
  nextRequestId += 1;
  const requestId = `loc_${Date.now()}_${nextRequestId}`;

  const promise = new Promise<UserLocation | null>((resolve) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      console.log(`[LocationBridge] 请求 ${requestId} 超时`);
      resolve(null);
    }, LOCATION_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, timer });
  });

  console.log(`[LocationBridge] 创建请求 ${requestId}`);
  return { requestId, promise };
}

/**
 * 前端回传位置数据 —— 由 POST /piko/ai/location/v1 调用。
 * @returns true 表示找到了对应的请求，false 表示请求已超时或不存在。
 */
export function resolveLocationRequest(
  requestId: string,
  location: UserLocation | null,
): boolean {
  const pending = pendingRequests.get(requestId);
  if (!pending) {
    console.log(`[LocationBridge] 请求 ${requestId} 不存在或已超时`);
    return false;
  }

  clearTimeout(pending.timer);
  pendingRequests.delete(requestId);
  pending.resolve(location);
  console.log(
    `[LocationBridge] 请求 ${requestId} 已解决: ${location ? `${location.latitude},${location.longitude}` : 'null'}`,
  );
  return true;
}
