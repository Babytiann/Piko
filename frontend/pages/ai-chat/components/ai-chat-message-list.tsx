import React, { useCallback, useRef, useEffect } from 'react';
import type { ReactElement } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import type { AiMessage } from '../types';
import AiChatBubble from './ai-chat-bubble';
import AiChatEmpty from './ai-chat-empty';

const NEAR_BOTTOM_THRESHOLD = 80;

interface Props {
  messages: AiMessage[];
  contentPaddingBottom: number;
  emptyTitle: string;
  emptySubtitle: string;
}

export default function AiChatMessageList({
  messages,
  contentPaddingBottom,
  emptyTitle,
  emptySubtitle,
}: Props): ReactElement {
  const listRef = useRef<FlatList<AiMessage>>(null);
  const isNearBottomRef = useRef(true);

  const lastContentLen = messages[messages.length - 1]?.content.length ?? 0;

  useEffect(() => {
    if (messages.length === 0 || !isNearBottomRef.current) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 16);
    return () => clearTimeout(timer);
  }, [messages.length, lastContentLen]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      isNearBottomRef.current =
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - NEAR_BOTTOM_THRESHOLD;
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AiMessage>): ReactElement => (
      <AiChatBubble message={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: AiMessage) => item.id, []);

  if (messages.length === 0) {
    return <AiChatEmpty title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onScroll={handleScroll}
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
