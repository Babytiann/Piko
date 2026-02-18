import React, { useCallback, useRef, useEffect } from 'react';
import type { ReactElement } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import type { AiMessage, BubbleLayout } from '../types';
import { NEAR_BOTTOM_THRESHOLD, SCROLL_DELAY_MS } from '../consts';
import AiChatBubble from './ai-chat-bubble';
import AiChatEmpty from './ai-chat-empty';

interface Props {
  messages: AiMessage[];
  contentPaddingBottom: number;
  emptyTitle: string;
  emptySubtitle: string;
  tooltipMessageId?: string;
  onMessageLongPress?: (message: AiMessage, layout: BubbleLayout) => void;
}

export default function AiChatMessageList({
  messages,
  contentPaddingBottom,
  emptyTitle,
  emptySubtitle,
  tooltipMessageId,
  onMessageLongPress,
}: Props): ReactElement {
  const listRef = useRef<FlatList<AiMessage>>(null);
  const isNearBottomRef = useRef(true);
  const prevHeightRef = useRef(0);

  const lastContentLen = messages[messages.length - 1]?.content.length ?? 0;

  useEffect(() => {
    if (messages.length === 0 || !isNearBottomRef.current) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [messages.length, lastContentLen]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    isNearBottomRef.current =
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - NEAR_BOTTOM_THRESHOLD;
  };

  const handleKeyBoardLayout = (e: LayoutChangeEvent): void => {
    const newHeight = e.nativeEvent.layout.height;
    const heightDecreased =
      prevHeightRef.current > 0 && newHeight < prevHeightRef.current;
    prevHeightRef.current = newHeight;

    if (heightDecreased && isNearBottomRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, SCROLL_DELAY_MS);
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AiMessage>): ReactElement => (
      <AiChatBubble
        message={item}
        isTooltipTarget={item.id === tooltipMessageId}
        onLongPress={onMessageLongPress}
      />
    ),
    [tooltipMessageId, onMessageLongPress],
  );

  if (messages.length === 0) {
    return <AiChatEmpty title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <FlatList
      ref={listRef}
      style={{ flex: 1 }}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item: AiMessage) => item.id}
      onScroll={handleScroll}
      onLayout={handleKeyBoardLayout}
      scrollEventThrottle={100}
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: contentPaddingBottom,
      }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}
