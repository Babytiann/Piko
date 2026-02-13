import type { ReactNode } from 'react';
import { useState } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { Image } from 'expo-image';

import { API_HOST } from '@/services';
import type { MessageItem } from '@/common/typings/chat';
import Avatar from '@/common/components/avatar';

interface ChatDetailMessageBubbleProps {
  message: MessageItem;
  showAvatar?: boolean;
}

function ReplyPreview({
  senderName,
  text,
  isMe,
}: {
  senderName: string | null;
  text: string | null;
  isMe: boolean;
}): ReactNode {
  if (!senderName && !text) return null;

  return (
    <XStack
      mb="$1.5"
      pl="$2"
      borderLeftWidth={2}
      borderLeftColor={isMe ? '$blue4' : '$blue9'}
    >
      <YStack gap={2} style={{ flexShrink: 1 }}>
        {senderName ? (
          <Text
            fontSize="$1"
            fontWeight="600"
            color={isMe ? '$blue3' : '$blue10'}
            numberOfLines={1}
          >
            {senderName}
          </Text>
        ) : null}
        {text ? (
          <Text
            fontSize="$1"
            color={isMe ? '$blue4' : '$gray11'}
            numberOfLines={2}
          >
            {text}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  );
}

function MediaImage({ url, isMe }: { url: string; isMe: boolean }): ReactNode {
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View
        bg={isMe ? '$blue8' : '$gray5'}
        mb="$1"
        px="$3"
        py="$2"
        style={{ borderRadius: 12, alignItems: 'center' }}
      >
        <Text fontSize="$1" color={isMe ? '$blue3' : '$gray10'}>
          [图片加载失败]
        </Text>
      </View>
    );
  }

  return (
    <View
      mb="$1"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        aspectRatio,
        maxHeight: 260,
      }}
    >
      <Image
        source={{ uri: `${API_HOST}${url}` }}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        contentFit="cover"
        transition={200}
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) {
            setAspectRatio(Math.min(Math.max(width / height, 0.5), 2.5));
          }
        }}
        onError={() => setError(true)}
        placeholder={isMe ? '#1a6dcc' : '#d4d4d8'}
        placeholderContentFit="cover"
      />
    </View>
  );
}

export default function ChatDetailMessageBubble({
  message,
  showAvatar = false,
}: ChatDetailMessageBubbleProps): ReactNode {
  const { isMe } = message;
  const hasReply =
    message.replyToMsgId != null &&
    (message.replyToText != null || message.replyToSenderName != null);
  const hasImage = message.hasMedia && !!message.mediaUrl;

  const bubbleContent = (
    <YStack
      bg={isMe ? '$blue9' : '$gray4'}
      px="$3"
      py="$2"
      style={{
        maxWidth: '80%',
        borderRadius: 16,
        borderBottomRightRadius: isMe ? 4 : 16,
        borderBottomLeftRadius: isMe ? 16 : 4,
      }}
    >
      {!isMe && message.senderName ? (
        <Text fontSize="$1" fontWeight="600" color="$blue10" mb="$1">
          {message.senderName}
        </Text>
      ) : null}

      {hasReply ? (
        <ReplyPreview
          senderName={message.replyToSenderName}
          text={message.replyToText}
          isMe={isMe}
        />
      ) : null}

      {hasImage ? <MediaImage url={message.mediaUrl!} isMe={isMe} /> : null}

      {message.text ? (
        <Text
          fontSize="$3"
          color={isMe ? 'white' : '$color'}
          lineHeight={20}
          selectable
        >
          {message.text}
        </Text>
      ) : message.hasMedia && !hasImage ? (
        <Text
          fontSize="$2"
          color={isMe ? '$blue3' : '$gray10'}
          fontStyle="italic"
        >
          [{message.mediaType ?? '媒体'}]
        </Text>
      ) : null}

      <Text
        fontSize={10}
        color={isMe ? '$blue4' : '$gray10'}
        mt="$1"
        style={{ textAlign: 'right' }}
      >
        {message.time}
      </Text>
    </YStack>
  );

  if (!isMe && showAvatar) {
    return (
      <XStack px="$3" py="$1" gap="$2" style={{ alignItems: 'flex-end' }}>
        <Avatar
          url={message.senderAvatarUrl}
          text={message.senderName?.charAt(0)?.toUpperCase() ?? '?'}
          color="#4ECDC4"
          size={32}
        />
        {bubbleContent}
      </XStack>
    );
  }

  return (
    <YStack
      px="$3"
      py="$1"
      style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}
    >
      {bubbleContent}
    </YStack>
  );
}
