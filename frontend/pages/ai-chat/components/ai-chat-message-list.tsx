import React, { useCallback, useRef, useEffect } from 'react';
import type { ReactElement } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';

import type { AiMessage } from '../types';
import AiChatBubble from './ai-chat-bubble';
import AiChatEmpty from './ai-chat-empty';

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

  // Auto-scroll to bottom when new messages arrive or content updates.
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, messages[messages.length - 1]?.content.length]);

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
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: contentPaddingBottom,
      }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}
