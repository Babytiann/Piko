import {
  pendingRequests,
  LOCATION_TIMEOUT_MS,
  incrementRequestId,
  UserLocation,
} from './store.js';

export function createLocationRequest(): {
  requestId: string;
  promise: Promise<UserLocation | null>;
} {
  const requestId = `loc_${Date.now()}_${incrementRequestId()}`;

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
