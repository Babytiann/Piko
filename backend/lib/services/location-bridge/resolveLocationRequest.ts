import type { UserLocation } from './store';
import { pendingRequests } from './store';

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
