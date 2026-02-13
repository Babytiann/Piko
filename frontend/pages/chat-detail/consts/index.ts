/** Poll for new messages every 3 seconds while the chat screen is active. */
export const CHAT_POLLING_INTERVAL = 3_000;

/** Chat types that may have multiple senders and should display avatars. */
export const MULTI_SENDER_TYPES = new Set(['group', 'channel']);

/**
 * Threshold to distinguish optimistic (client-generated) message ids from real
 * Telegram message ids.  Optimistic ids are created via `Date.now()` which
 * yields values > 1e12, while Telegram ids are sequential integers.
 */
export const OPTIMISTIC_ID_THRESHOLD = 1e12;
