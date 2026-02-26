const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

export function getAvatarColor(id: string): string {
  const index = Math.abs(parseInt(id, 10) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function formatTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function buildAvatarUrl(
  session: string,
  peerId: string,
  peerType: string,
  accessHash: string,
): string {
  const params = new URLSearchParams({
    session,
    peerId,
    peerType,
    accessHash,
  });
  return `/piko/telegram/avatar/v1?${params.toString()}`;
}

export function buildMediaUrl(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  messageId: number,
): string {
  const params = new URLSearchParams({
    session,
    chatId,
    chatType,
    accessHash,
    messageId: messageId.toString(),
  });
  return `/piko/telegram/media/v1?${params.toString()}`;
}

export const IMAGE_MEDIA_TYPES = new Set([
  'MessageMediaPhoto',
  'MessageMediaDocument',
]);

export function truncateText(text: string, maxLength = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
