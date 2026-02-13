import type { MessageItem } from '@/common/typings/chat';

import { OPTIMISTIC_ID_THRESHOLD } from '../consts';

/**
 * Merge a fresh batch of messages (newest-first, from the server) into the
 * existing local message list.  Handles de-duplication by id and removes stale
 * optimistic messages that have now been confirmed by the server.
 */
export function mergeLatestMessages(
  prev: MessageItem[],
  freshBatch: MessageItem[],
): MessageItem[] {
  const realPrev = prev.filter((m) => m.id < OPTIMISTIC_ID_THRESHOLD);
  const existingIds = new Set(realPrev.map((m) => m.id));
  const newMsgs = freshBatch.filter((m) => !existingIds.has(m.id));

  if (newMsgs.length === 0 && realPrev.length === prev.length) return prev;

  return [...newMsgs, ...realPrev];
}
