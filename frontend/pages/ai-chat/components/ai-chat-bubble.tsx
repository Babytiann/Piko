import React, { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Platform, View as RNView } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { AiMessage, BubbleLayout } from '../types';
import AiChatMarkdown from './ai-chat-markdown';

interface Props {
  message: AiMessage;
  isTooltipTarget?: boolean;
  onLongPress?: (message: AiMessage, layout: BubbleLayout) => void;
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

function AiChatBubble({
  message,
  isTooltipTarget,
  onLongPress,
}: Props): ReactNode {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && message.isStreaming;
  const bubbleRef = useRef<RNView>(null);

  const handleLongPress = useCallback(() => {
    if (!onLongPress || message.isStreaming || !message.content) return;

    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(message, { pageX: x, pageY: y, width, height });
    });
  }, [message, onLongPress]);

  const canInteract = isUser || !isEmpty;

  const Wrapper = isUser ? YStack : XStack;

  return (
    <Wrapper
      px="$3"
      py="$1"
      {...(!isUser && { gap: '$2' })}
      style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
    >
      {!isUser && <AiAvatar />}
      <RNView
        ref={bubbleRef}
        collapsable={false}
        style={[
          { maxWidth: isUser ? '80%' : '78%' },
          isTooltipTarget && { opacity: 0 },
        ]}
      >
        <YStack
          bg={isUser ? '$blue9' : '$gray4'}
          px="$3.5"
          py="$2.5"
          pressStyle={canInteract ? { opacity: 0.85 } : undefined}
          onLongPress={canInteract ? handleLongPress : undefined}
          style={{
            borderRadius: 18,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          }}
        >
          {isUser ? (
            <Text fontSize="$3" color="white" lineHeight={22}>
              {message.content}
            </Text>
          ) : isEmpty ? (
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
      </RNView>
    </Wrapper>
  );
}

export default React.memo(AiChatBubble, (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return (
    p.content === n.content &&
    p.isStreaming === n.isStreaming &&
    prev.onLongPress === next.onLongPress &&
    prev.isTooltipTarget === next.isTooltipTarget
  );
});
