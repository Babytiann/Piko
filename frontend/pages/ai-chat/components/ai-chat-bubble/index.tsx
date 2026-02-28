import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import { Platform, View as RNView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import * as Haptics from 'expo-haptics';

import type { AiMessage, AiPageData, BubbleLayout } from '../../types';
import AiChatMarkdown from '../ai-chat-markdown';
import WaitingIndicator from './waiting-indicator';
import AiAvatar from './ai-avatar';
import AiThinkingStatus from './ai-thinking-status';

interface Props {
  message: AiMessage;
  isTooltipTarget?: boolean;
  onLongPress?: (message: AiMessage, layout: BubbleLayout) => void;
  onRequestLocationPermission?: (messageId: string) => void;
  pageData?: AiPageData;
}

function AiChatBubble({
  message,
  isTooltipTarget,
  onLongPress,
  onRequestLocationPermission,
  pageData,
}: Props): ReactNode {
  const isUser = message.role === 'user';
  const bubbleRef = useRef<RNView>(null);

  function handleLongPress(): void {
    if (!onLongPress || message.isStreaming || !message.content) return;

    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(message, { pageX: x, pageY: y, width, height });
    });
  }

  if (!isUser) {
    const hasContent = !!message.content;

    return (
      <YStack px="$3" py="$2" gap="$2">
        <XStack gap="$2" style={{ alignItems: 'center' }}>
          <AiAvatar />
          <AiThinkingStatus message={message} />
        </XStack>

        {hasContent && (
          <YStack flex={1} px="$1" py="$1">
            <AiChatMarkdown
              content={message.content}
              isStreaming={message.isStreaming}
              navAmapTitle={pageData?.nav_amap_title}
              navGoogleTitle={pageData?.nav_google_title}
              navOpenHint={pageData?.nav_open_hint}
            />
            {message.isStreaming && <WaitingIndicator />}
          </YStack>
        )}

        {message.locationDeniedHint ? (
          <XStack
            gap="$2"
            px="$1"
            mt="$1"
            style={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Text fontSize={12} color="$yellow10">
              {message.locationDeniedHint}
            </Text>
            {message.locationRequestId && onRequestLocationPermission ? (
              <Text
                fontSize={12}
                color="$primary"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => onRequestLocationPermission(message.id)}
              >
                {pageData?.bubble_grant_location ?? '点击授权位置权限'}
              </Text>
            ) : null}
          </XStack>
        ) : null}
      </YStack>
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
          bg="#60A5FA"
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
    p.locationDeniedHint === n.locationDeniedHint &&
    p.locationRequestId === n.locationRequestId &&
    prev.onLongPress === next.onLongPress &&
    prev.isTooltipTarget === next.isTooltipTarget &&
    prev.onRequestLocationPermission === next.onRequestLocationPermission &&
    prev.pageData === next.pageData
  );
});
