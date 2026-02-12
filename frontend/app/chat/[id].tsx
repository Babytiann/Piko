import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import { usePageData } from '@/hooks/usePageData';
import { fetchChatDetailPage } from '@/services/chat';
import type { ChatDetailPageData, MessageItem } from '@/types/chat';
import * as telegramApi from '@/services/telegram';
import PageLoading from '@/components/shared/pageLoading';
import PageError from '@/components/shared/pageStatusView';
import MessageBubble from '@/components/chat/message-bubble';
import MessageInput from '@/components/chat/message-input';
import MessageContextMenu from '@/components/chat/message-context-menu';

/** Poll for new messages every 3 seconds while the chat screen is active. */
const CHAT_POLLING_INTERVAL = 3_000;

/** Chat types that may have multiple senders and should display avatars. */
const MULTI_SENDER_TYPES = new Set(['group', 'channel']);

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { id, title, chatType, accessHash } = useLocalSearchParams<{
    id: string;
    title?: string;
    chatType?: string;
    accessHash?: string;
  }>();
  const { session } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);

  const showAvatar = MULTI_SENDER_TYPES.has(chatType ?? '');

  const pollingOptions = useMemo(
    () => ({ pollingInterval: CHAT_POLLING_INTERVAL }),
    [],
  );

  const { data, loading, error, refresh, silentRefresh, setData } =
    usePageData<ChatDetailPageData>(
      () =>
        fetchChatDetailPage(
          session ?? '',
          id ?? '',
          chatType ?? 'user',
          accessHash ?? '',
          title ?? 'Chat',
        ),
      [session, id, chatType, accessHash, title],
      pollingOptions,
    );

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: data?.header.title ?? title ?? 'Chat',
    });
  }, [navigation, data?.header.title, title]);

  // ---- Send with optimistic update ----------------------------------

  const handleSend = useCallback(
    async (text: string) => {
      if (!session || !id) return;

      // Build an optimistic message to display immediately
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const optimisticMsg: MessageItem = {
        id: Date.now(), // temp id — replaced on next refresh
        text,
        time: timeStr,
        senderName: '',
        isMe: true,
        hasMedia: false,
        mediaType: null,
        mediaUrl: null,
        replyToMsgId: replyTo?.id ?? null,
        replyToText: replyTo?.text ?? null,
        replyToSenderName: replyTo?.senderName ?? null,
      };

      // Optimistically append the new message
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, optimisticMsg] };
      });

      // Clear reply state
      setReplyTo(null);

      // Scroll to bottom after optimistic insert
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        50,
      );

      // Fire the real API call
      try {
        await telegramApi.sendMessage(
          session,
          id,
          chatType ?? 'user',
          accessHash ?? '',
          text,
          replyTo?.id,
        );
      } catch {
        // On failure the next poll will reconcile
      }

      // Silently refresh to get the server-confirmed message list
      silentRefresh();
    },
    [session, id, chatType, accessHash, replyTo, setData, silentRefresh],
  );

  // ---- Reply handler ------------------------------------------------

  const handleReply = useCallback((msg: MessageItem) => {
    setReplyTo(msg);
  }, []);

  // ---- Render -------------------------------------------------------

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  // Messages come newest-first from server; reverse for chronological display.
  // Optimistic messages are already appended at the end, so they appear last.
  const messages =
    data.messages[0]?.id > data.messages[data.messages.length - 1]?.id
      ? [...data.messages].reverse()
      : data.messages;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <YStack flex={1} bg="$background">
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center py-10">
            <Text color="$gray11" fontSize="$3">
              暂无消息
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }: { item: MessageItem }) => (
              <MessageContextMenu message={item} onReply={handleReply}>
                <MessageBubble message={item} showAvatar={showAvatar} />
              </MessageContextMenu>
            )}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        <MessageInput
          placeholder={data.inputPlaceholder}
          onSend={handleSend}
          bottomInset={insets.bottom}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}
