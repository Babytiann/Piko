import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { XStack, YStack, Text } from 'tamagui';
import { Portal } from '@tamagui/portal';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import type { TooltipTarget } from '../types';
import {
  ANIM_DURATION,
  BACKDROP_INTENSITY,
  MESSAGE_SCALE,
  TOOLTIP_GAP,
  TOOLTIP_HEIGHT,
} from '../consts';
import AiChatMarkdown from './ai-chat-markdown';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  target: TooltipTarget | null;
  onClose: () => void;
}

export default function AiChatTooltip({ target, onClose }: Props): ReactNode {
  const insets = useSafeAreaInsets();

  const backdropOpacity = useSharedValue(0);
  const messageScale = useSharedValue(1);
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateY = useSharedValue(8);

  const allParamsRef = useRef({
    backdropOpacity,
    messageScale,
    tooltipOpacity,
    tooltipTranslateY,
  });
  allParamsRef.current = {
    backdropOpacity,
    messageScale,
    tooltipOpacity,
    tooltipTranslateY,
  };

  useEffect(() => {
    if (target) {
      const {
        backdropOpacity,
        messageScale,
        tooltipOpacity,
        tooltipTranslateY,
      } = allParamsRef.current;

      backdropOpacity.value = withTiming(1, { duration: ANIM_DURATION });
      messageScale.value = withTiming(MESSAGE_SCALE, {
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.ease),
      });
      tooltipOpacity.value = withDelay(
        80,
        withTiming(1, { duration: ANIM_DURATION }),
      );
      tooltipTranslateY.value = withDelay(
        80,
        withTiming(0, {
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.ease),
        }),
      );
    }
  }, [target]);

  const animateClose = useCallback(() => {
    const { backdropOpacity, messageScale, tooltipOpacity, tooltipTranslateY } =
      allParamsRef.current;

    messageScale.value = withTiming(1, { duration: 150 });
    tooltipOpacity.value = withTiming(0, { duration: 100 });
    tooltipTranslateY.value = withTiming(8, { duration: 100 });
    backdropOpacity.value = withTiming(
      0,
      { duration: 150, easing: Easing.out(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    if (!target) return;
    await Clipboard.setStringAsync(target.message.content);
    if (Platform.OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    animateClose();
  }, [target, animateClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
  }));

  const tooltipAnimStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateY: tooltipTranslateY.value }],
  }));

  if (!target) return null;

  const { layout, message } = target;
  const isUser = message.role === 'user';

  const spaceAbove = layout.pageY - insets.top;
  const showAbove = spaceAbove >= TOOLTIP_HEIGHT + TOOLTIP_GAP;
  const tooltipTop = showAbove
    ? layout.pageY - TOOLTIP_HEIGHT - TOOLTIP_GAP
    : layout.pageY + layout.height + TOOLTIP_GAP;

  const tooltipLeft = Math.max(
    12,
    Math.min(layout.pageX + layout.width / 2 - 60, SCREEN_WIDTH - 132),
  );

  return (
    <Portal>
      {/* 第 1 层：高斯模糊蒙层 */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView
          intensity={BACKDROP_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />
      </Animated.View>

      {/* 第 2 层：消息气泡（浮在模糊层之上） */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: layout.pageY,
            left: layout.pageX,
            width: layout.width,
            height: layout.height,
            overflow: 'hidden',
          },
          messageAnimStyle,
        ]}
      >
        <YStack
          bg={isUser ? '$blue9' : '$gray4'}
          px="$3.5"
          py="$2.5"
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
          ) : (
            <AiChatMarkdown content={message.content} isStreaming={false} />
          )}
        </YStack>
      </Animated.View>

      {/* 第 3 层：Tooltip 菜单 */}
      <Animated.View
        style={[
          styles.tooltipMenu,
          { top: tooltipTop, left: tooltipLeft },
          tooltipAnimStyle,
        ]}
      >
        <Pressable onPress={() => void handleCopy()}>
          <XStack
            bg="$gray12"
            px="$4"
            py="$2.5"
            gap="$2"
            style={{
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
            <Text fontSize="$2" fontWeight="600" color="white">
              复制
            </Text>
          </XStack>
        </Pressable>
      </Animated.View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  tooltipMenu: {
    position: 'absolute',
  },
});
