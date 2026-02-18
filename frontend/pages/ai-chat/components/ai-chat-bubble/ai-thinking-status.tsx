import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { XStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import type { AiMessage } from '../../types';

interface Props {
  message: AiMessage;
}

type StatusKind =
  | 'tool_loading'
  | 'thinking'
  | 'replying'
  | 'tool_done'
  | 'idle';

const ACTIVE_KINDS = new Set<StatusKind>([
  'tool_loading',
  'thinking',
  'replying',
]);

function deriveActiveKind(message: AiMessage): StatusKind {
  const activeTool = (message.toolCalls ?? []).find((tc) => tc.loading);
  if (activeTool) return 'tool_loading';
  if (message.isStreaming && !message.content) return 'thinking';
  if (message.isStreaming) return 'replying';
  return 'idle';
}

function getStatusText(message: AiMessage, kind: StatusKind): string {
  switch (kind) {
    case 'tool_loading': {
      const active = (message.toolCalls ?? []).find((tc) => tc.loading);
      return active?.message ?? '正在处理...';
    }
    case 'thinking': {
      const hasCompletedTools = (message.toolCalls ?? []).length > 0;
      return hasCompletedTools ? '正在整理信息...' : '正在思考...';
    }
    case 'replying':
      return '正在回复...';
    case 'tool_done': {
      const calls = message.toolCalls ?? [];
      const last = calls[calls.length - 1];
      if (!last) return '';
      return last.message.replace('正在', '已').replace(/\.+$/, '');
    }
    default:
      return '';
  }
}

export default function AiThinkingStatus({ message }: Props): ReactNode {
  const theme = useTheme();
  const activeKind = deriveActiveKind(message);
  const isActive = ACTIVE_KINDS.has(activeKind);

  const [showDone, setShowDone] = useState(false);
  const wasStreamingRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const was = wasStreamingRef.current;
    wasStreamingRef.current = !!message.isStreaming;

    if (was && !message.isStreaming && (message.toolCalls?.length ?? 0) > 0) {
      setShowDone(true);
    }
  }, [message.isStreaming, message.toolCalls?.length]);

  const effectiveKind: StatusKind = isActive
    ? activeKind
    : showDone
      ? 'tool_done'
      : 'idle';

  const text = getStatusText(message, effectiveKind);
  const isDone = effectiveKind === 'tool_done';

  const opacity = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(opacity);

    if (isActive) {
      opacity.value = 1;
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else if (showDone) {
      opacity.value = 1;
      opacity.value = withDelay(
        1500,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }),
      );
      const timer = setTimeout(() => setShowDone(false), 2100);
      return () => clearTimeout(timer);
    } else {
      opacity.value = 0;
    }
  }, [isActive, showDone]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (effectiveKind === 'idle') return null;

  return (
    <Animated.View style={animStyle}>
      <XStack gap="$1.5" style={{ alignItems: 'center' }}>
        {isDone && (
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={theme.green10.val}
          />
        )}
        <Text fontSize="$2" color="$gray10">
          {text}
        </Text>
      </XStack>
    </Animated.View>
  );
}
