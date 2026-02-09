import { YStack, Text } from 'tamagui';
import type { MessageItem } from '@/types/chat';

interface MessageBubbleProps {
  message: MessageItem;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { isMe } = message;

  return (
    <YStack alignItems={isMe ? 'flex-end' : 'flex-start'} px="$3" py="$1">
      <YStack
        maxWidth="80%"
        bg={isMe ? '$blue9' : '$gray4'}
        borderRadius="$4"
        px="$3"
        py="$2"
        borderBottomRightRadius={isMe ? '$1' : '$4'}
        borderBottomLeftRadius={isMe ? '$4' : '$1'}
      >
        {!isMe && message.senderName ? (
          <Text
            fontSize="$1"
            fontWeight="600"
            color={isMe ? '$blue3' : '$blue10'}
            mb="$1"
          >
            {message.senderName}
          </Text>
        ) : null}

        {message.text ? (
          <Text fontSize="$3" color={isMe ? 'white' : '$color'} lineHeight={20}>
            {message.text}
          </Text>
        ) : message.hasMedia ? (
          <Text
            fontSize="$2"
            color={isMe ? '$blue3' : '$gray10'}
            fontStyle="italic"
          >
            [{message.mediaType ?? 'Media'}]
          </Text>
        ) : null}

        <Text
          fontSize={10}
          color={isMe ? '$blue4' : '$gray10'}
          textAlign="right"
          mt="$1"
        >
          {message.time}
        </Text>
      </YStack>
    </YStack>
  );
}
