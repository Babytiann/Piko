import React from 'react';
import type { ReactNode } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { AiMessage } from '../types';
import AiChatMarkdown from './ai-chat-markdown';

interface Props {
  message: AiMessage;
}

function StreamingIndicator(): ReactNode {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Text fontSize="$3" color="$blue9" ml="$1">
        ●
      </Text>
    </Animated.View>
  );
}

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

function AiChatBubble({ message }: Props): ReactNode {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && message.isStreaming;

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

  return (
    <XStack px="$3" py="$1" gap="$2" style={{ alignItems: 'flex-start' }}>
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
          <YStack>
            <AiChatMarkdown
              content={message.content}
              isStreaming={message.isStreaming}
            />
            {message.isStreaming ? <StreamingIndicator /> : null}
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}

export default React.memo(AiChatBubble, (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return p.content === n.content && p.isStreaming === n.isStreaming;
});
