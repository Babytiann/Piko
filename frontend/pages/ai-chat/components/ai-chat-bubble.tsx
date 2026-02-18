import React, { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Platform, View as RNView } from 'react-native';
import { YStack, XStack, Text, View, useTheme } from 'tamagui';
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

function WaitingIndicator({ text }: { text?: string }): ReactNode {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withTiming(text ? 0.4 : 0.25, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    }),
    -1,
    true,
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      {text ? (
        <Text fontSize="$3" color="$gray10" lineHeight={22}>
          {text}
        </Text>
      ) : (
        <Text fontSize="$3" color="$blue9" ml="$1">
          ●
        </Text>
      )}
    </Animated.View>
  );
}

function AiAvatar(): ReactNode {
  const theme = useTheme();

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
      <Ionicons name="sparkles" size={16} color={theme.blue10.val} />
    </View>
  );
}

function AiChatBubble({
  message,
  isTooltipTarget,
  onLongPress,
}: Props): ReactNode {
  const isUser = message.role === 'user';
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

  if (!isUser) {
    const hasContent = !!message.content;

    return (
      <XStack
        px="$3"
        py="$1"
        gap="$2"
        style={{ alignItems: hasContent ? 'flex-start' : 'center' }}
      >
        <AiAvatar />
        <YStack flex={1} px="$1" py="$1">
          {hasContent ? (
            <YStack>
              <AiChatMarkdown
                content={message.content}
                isStreaming={message.isStreaming}
              />
              {message.isStreaming ? <WaitingIndicator /> : null}
            </YStack>
          ) : (
            <WaitingIndicator text={message.statusText} />
          )}
        </YStack>
      </XStack>
    );
  }

  return (
    <YStack px="$3" py="$1" style={{ alignItems: 'flex-end' }}>
      <RNView
        ref={bubbleRef}
        collapsable={false}
        style={[{ maxWidth: '80%' }, isTooltipTarget && { opacity: 0 }]}
      >
        <YStack
          bg="$blue9"
          px="$3.5"
          py="$2.5"
          pressStyle={{ opacity: 0.85 }}
          onLongPress={handleLongPress}
          style={{ borderRadius: 18, borderBottomRightRadius: 4 }}
        >
          <Text fontSize="$3" color="white" lineHeight={22}>
            {message.content}
          </Text>
        </YStack>
      </RNView>
    </YStack>
  );
}

export default React.memo(AiChatBubble, (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return (
    p.content === n.content &&
    p.isStreaming === n.isStreaming &&
    p.toolCalls === n.toolCalls &&
    p.statusText === n.statusText &&
    prev.onLongPress === next.onLongPress &&
    prev.isTooltipTarget === next.isTooltipTarget
  );
});
