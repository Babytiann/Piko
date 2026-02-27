import type { ReactNode } from 'react';
import { YStack, XStack, Text } from 'tamagui';

interface Props {
  senderName: string | null;
  text: string | null;
  isMe: boolean;
}

export default function ReplyPreview({
  senderName,
  text,
  isMe,
}: Props): ReactNode {
  if (!senderName && !text) return null;

  return (
    <XStack
      mb="$1.5"
      pl="$2"
      borderLeftWidth={2}
      borderLeftColor={isMe ? '$gray5' : '$primary'}
    >
      <YStack gap={2} style={{ flexShrink: 1 }}>
        {senderName ? (
          <Text
            fontSize="$1"
            fontWeight="600"
            color={isMe ? '$primaryForeground' : '$primary'}
            numberOfLines={1}
          >
            {senderName}
          </Text>
        ) : null}
        {text ? (
          <Text
            fontSize="$1"
            color={isMe ? '$primaryForeground' : '$gray11'}
            numberOfLines={2}
          >
            {text}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  );
}
