import type { ReactNode } from 'react';
import { YStack, XStack, Text } from 'tamagui';

import type { MessageItem } from '@/common/typings/chat';
import Avatar from '@/common/components/avatar';

import ReplyPreview from './reply-preview';
import MediaImage from './media-image';

interface Props {
  message: MessageItem;
  showAvatar?: boolean;
}

export default function ChatDetailMessageBubble({
  message,
  showAvatar = false,
}: Props): ReactNode {
  const isMe = message.is_me;
  const hasReply =
    message.reply_to_msg_id != null &&
    (message.reply_to_text != null || message.reply_to_sender_name != null);
  const hasImage = message.has_media && !!message.media_url;

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
      {!isMe && message.sender_name ? (
        <Text fontSize="$1" fontWeight="600" color="$blue10" mb="$1">
          {message.sender_name}
        </Text>
      ) : null}

      {hasReply ? (
        <ReplyPreview
          senderName={message.reply_to_sender_name}
          text={message.reply_to_text}
          isMe={isMe}
        />
      ) : null}

      {hasImage ? <MediaImage url={message.media_url!} isMe={isMe} /> : null}

      {message.text ? (
        <Text
          fontSize="$3"
          color={isMe ? 'white' : '$color'}
          lineHeight={20}
          selectable
        >
          {message.text}
        </Text>
      ) : message.has_media && !hasImage ? (
        <Text
          fontSize="$2"
          color={isMe ? '$blue3' : '$gray10'}
          fontStyle="italic"
        >
          [{message.media_type ?? '媒体'}]
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
          url={message.sender_avatar_url}
          text={message.sender_name?.charAt(0)?.toUpperCase() ?? '?'}
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
