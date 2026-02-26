export const API_ID = Number(process.env.TELEGRAM_API_ID);
export const API_HASH = process.env.TELEGRAM_API_HASH!;

if (!API_ID || !API_HASH) {
  console.warn(
    'TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env.local',
  );
}

/** Time-to-live for idle pooled clients (10 minutes). */
export const POOL_TTL = 10 * 60 * 1000;
/** Maximum number of concurrent clients in the pool. */
export const POOL_MAX_SIZE = 20;
/** Interval for sweeping expired clients (60 seconds). */
export const POOL_SWEEP_INTERVAL = 60 * 1000;
