import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Image } from 'expo-image';
import { API_HOST } from '@/services/api-client';
import type { MessageItem } from '@/types/chat';

interface MessageBubbleProps {
  message: MessageItem;
}

function ReplyPreview({
  senderName,
  text,
  isMe,
}: {
  senderName: string | null;
  text: string | null;
  isMe: boolean;
}) {
  if (!senderName && !text) return null;

  return (
    <XStack
      mb="$1.5"
      pl="$2"
      borderLeftWidth={2}
      borderLeftColor={isMe ? '$blue4' : '$blue9'}
    >
      <YStack gap={2} flexShrink={1}>
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

function MediaImage({ url, isMe }: { url: string; isMe: boolean }) {
  const [aspectRatio, setAspectRatio] = useState(1.5);

  return (
    <View
      borderRadius="$3"
      overflow="hidden"
      mb="$1"
      style={{ aspectRatio, maxHeight: 260 }}
    >
      <Image
        source={{ uri: `${API_HOST}${url}` }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) {
            setAspectRatio(Math.min(Math.max(width / height, 0.5), 2.5));
          }
        }}
        placeholder={isMe ? '#1a6dcc' : '#d4d4d8'}
        placeholderContentFit="cover"
      />
    </View>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { isMe } = message;
  const hasReply =
    message.replyToMsgId != null &&
    (message.replyToText != null || message.replyToSenderName != null);
  const hasImage = message.hasMedia && !!message.mediaUrl;

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
        {/* Sender name (only for other people) */}
        {!isMe && message.senderName ? (
          <Text fontSize="$1" fontWeight="600" color="$blue10" mb="$1">
            {message.senderName}
          </Text>
        ) : null}

        {/* Reply preview */}
        {hasReply ? (
          <ReplyPreview
            senderName={message.replyToSenderName}
            text={message.replyToText}
            isMe={isMe}
          />
        ) : null}

        {/* Image media */}
        {hasImage ? <MediaImage url={message.mediaUrl!} isMe={isMe} /> : null}

        {/* Text body */}
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

        {/* Timestamp */}
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

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
