export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface PendingRequest {
  resolve: (location: UserLocation | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

export const LOCATION_TIMEOUT_MS = 15_000;

const globalForBridge = globalThis as unknown as {
  __locationBridge?: Map<string, PendingRequest>;
};

if (!globalForBridge.__locationBridge) {
  globalForBridge.__locationBridge = new Map();
}

export const pendingRequests = globalForBridge.__locationBridge;
export let nextRequestId = 0;

export function incrementRequestId(): number {
  nextRequestId += 1;
  return nextRequestId;
}
