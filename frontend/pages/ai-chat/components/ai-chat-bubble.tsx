import type { ReactNode } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import type { AiMessage } from '../types';

interface Props {
  message: AiMessage;
}

/** Animated dots shown while the model is still streaming. */
function StreamingIndicator(): ReactNode {
  return (
    <Text fontSize="$3" color="$gray10" ml="$1">
      ●
    </Text>
  );
}

/** Sparkle avatar for AI messages. */
function AiAvatar(): ReactNode {
  return (
    <View
      width={32}
      height={32}
      bg="$blue4"
      style={{
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="sparkles" size={16} color="#0a7ea4" />
    </View>
  );
}

export default function AiChatBubble({ message }: Props): ReactNode {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && message.isStreaming;

  // ── User bubble ────────────────────────────────────────────────────
  if (isUser) {
    return (
      <YStack px="$3" py="$1" style={{ alignItems: 'flex-end' }}>
        <YStack
          bg="$blue9"
          px="$3.5"
          py="$2.5"
          style={{
            maxWidth: '80%',
            borderRadius: 18,
            borderBottomRightRadius: 4,
          }}
        >
          <Text fontSize="$3" color="white" lineHeight={22} selectable>
            {message.content}
          </Text>
        </YStack>
      </YStack>
    );
  }

  // ── AI bubble ──────────────────────────────────────────────────────
  return (
    <XStack px="$3" py="$1" gap="$2" style={{ alignItems: 'flex-end' }}>
      <AiAvatar />
      <YStack
        bg="$gray4"
        px="$3.5"
        py="$2.5"
        style={{ maxWidth: '78%', borderRadius: 18, borderBottomLeftRadius: 4 }}
      >
        {isEmpty ? (
          <StreamingIndicator />
        ) : (
          <XStack style={{ alignItems: 'center' }}>
            <Text
              fontSize="$3"
              color="$color"
              lineHeight={22}
              selectable
              style={{ flexShrink: 1 }}
            >
              {message.content}
            </Text>
            {message.isStreaming ? <StreamingIndicator /> : null}
          </XStack>
        )}
      </YStack>
    </XStack>
  );
}
