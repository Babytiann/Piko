import type { ReactNode } from 'react';
import { YStack, XStack, Text } from 'tamagui';

import type { MessageItem } from '@/common/typings/chat';
import Avatar from '@/common/components/avatar';

import ReplyPreview from './reply-preview';
import MediaImage from './media-image';

const IMESSAGE_BLUE = '#007AFF';
const BUBBLE_RADIUS = 20;
const BUBBLE_TAIL = 4;

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
      bg={isMe ? IMESSAGE_BLUE : '$gray4'}
      px="$3"
      py="$2.5"
      style={{
        maxWidth: '80%',
        borderRadius: BUBBLE_RADIUS,
        borderBottomRightRadius: isMe ? BUBBLE_TAIL : BUBBLE_RADIUS,
        borderBottomLeftRadius: isMe ? BUBBLE_RADIUS : BUBBLE_TAIL,
      }}
    >
      {!isMe && message.sender_name ? (
        <Text fontSize="$1" fontWeight="600" color="$color" mb="$1">
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
          lineHeight={22}
          selectable
        >
          {message.text}
        </Text>
      ) : message.has_media && !hasImage ? (
        <Text
          fontSize="$2"
          color={isMe ? 'rgba(255,255,255,0.9)' : '$gray10'}
          fontStyle="italic"
        >
          [{message.media_type ?? '媒体'}]
        </Text>
      ) : null}

      <Text
        fontSize={10}
        color={isMe ? 'rgba(255,255,255,0.75)' : '$gray9'}
        mt="$1"
        style={{ textAlign: 'right' }}
      >
        {message.time}
      </Text>
    </YStack>
  );

  if (!isMe && showAvatar) {
    return (
      <XStack px="$3" py="$1.5" gap="$2" style={{ alignItems: 'flex-end' }}>
        <Avatar
          url={message.sender_avatar_url}
          text={message.sender_name?.charAt(0)?.toUpperCase() ?? '?'}
          color="#687076"
          size={32}
        />
        {bubbleContent}
      </XStack>
    );
  }

  return (
    <YStack
      px="$3"
      py="$1.5"
      style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}
    >
      {bubbleContent}
    </YStack>
  );
}
