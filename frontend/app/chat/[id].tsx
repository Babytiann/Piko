import { useRef, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { YStack, Text } from 'tamagui';

import { useAuth } from '@/hooks/useAuth';
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

/**
 * Threshold to distinguish optimistic (client-generated) message ids from real
 * Telegram message ids.  Optimistic ids are created via `Date.now()` which
 * yields values > 1e12, while Telegram ids are sequential integers.
 */
const OPTIMISTIC_ID_THRESHOLD = 1e12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merge a fresh batch of messages (newest-first, from the server) into the
 * existing local message list.  Handles de-duplication by id and removes stale
 * optimistic messages that have now been confirmed by the server.
 */
function mergeLatestMessages(
  prev: MessageItem[],
  freshBatch: MessageItem[],
): MessageItem[] {
  // Strip optimistic messages — the fresh batch will contain the real versions
  const realPrev = prev.filter((m) => m.id < OPTIMISTIC_ID_THRESHOLD);
  const existingIds = new Set(realPrev.map((m) => m.id));
  const newMsgs = freshBatch.filter((m) => !existingIds.has(m.id));

  // Nothing changed — return previous reference to avoid unnecessary re-render
  if (newMsgs.length === 0 && realPrev.length === prev.length) return prev;

  // New messages are prepended (newest-first order)
  return [...newMsgs, ...realPrev];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // ---- Page-level state -------------------------------------------------

  const [pageData, setPageData] = useState<ChatDetailPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- Message list state (managed independently for merge support) ------

  /** Messages stored in newest-first order (matches server response). */
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ---- Initial fetch ----------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchChatDetailPage(
      session ?? '',
      id ?? '',
      chatType ?? 'user',
      accessHash ?? '',
      title ?? 'Chat',
    )
      .then((data) => {
        if (cancelled) return;
        setPageData(data);
        setMessages(data.messages); // newest-first from server
        setHasMore(data.hasMore);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, id, chatType, accessHash, title]);

  // ---- Background polling — merge new messages --------------------------

  useEffect(() => {
    if (!session || !id) return;

    const poll = async () => {
      try {
        const data = await fetchChatDetailPage(
          session,
          id,
          chatType ?? 'user',
          accessHash ?? '',
          title ?? 'Chat',
        );
        setMessages((prev) => mergeLatestMessages(prev, data.messages));
      } catch {
        // Polling errors are swallowed to avoid flickering error UI
      }
    };

    const intervalId = setInterval(poll, CHAT_POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [session, id, chatType, accessHash, title]);

  // ---- Navigation title -------------------------------------------------

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: pageData?.header.title ?? title ?? 'Chat',
    });
  }, [navigation, pageData?.header.title, title]);

  // ---- Load more (older messages) ---------------------------------------

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !session || !id || messages.length === 0)
      return;

    setLoadingMore(true);
    try {
      // The oldest message is the last item (newest-first order)
      const oldestId = messages[messages.length - 1].id;
      const data = await fetchChatDetailPage(
        session,
        id,
        chatType ?? 'user',
        accessHash ?? '',
        title ?? 'Chat',
        oldestId,
      );

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const olderMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        // Append older messages at the end (they are older = smaller ids)
        return [...prev, ...olderMsgs];
      });
      setHasMore(data.hasMore);
    } catch {
      // Silently fail — user can scroll up again to retry
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    session,
    id,
    chatType,
    accessHash,
    title,
    messages,
  ]);

  // ---- Full refresh (for error retry) -----------------------------------

  const handleRefresh = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchChatDetailPage(
        session,
        id,
        chatType ?? 'user',
        accessHash ?? '',
        title ?? 'Chat',
      );
      setPageData(data);
      setMessages(data.messages);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [session, id, chatType, accessHash, title]);

  // ---- Send with optimistic update -------------------------------------

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

      // Prepend optimistic message (newest-first order)
      setMessages((prev) => [optimisticMsg, ...prev]);

      // Clear reply state
      setReplyTo(null);

      // Scroll to bottom (offset 0 in inverted list)
      setTimeout(
        () =>
          flatListRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
          }),
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
      try {
        const data = await fetchChatDetailPage(
          session,
          id,
          chatType ?? 'user',
          accessHash ?? '',
          title ?? 'Chat',
        );
        setMessages((prev) => mergeLatestMessages(prev, data.messages));
      } catch {
        // Swallow — next poll will reconcile
      }
    },
    [session, id, chatType, accessHash, title, replyTo],
  );

  // ---- Reply handler ----------------------------------------------------

  const handleReply = useCallback((msg: MessageItem) => {
    setReplyTo(msg);
  }, []);

  // ---- List footer (loading spinner for load-more) ----------------------
  // In an inverted FlatList the "footer" renders at the visual top.

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [loadingMore]);

  // ---- Render -----------------------------------------------------------

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={handleRefresh} />;
  if (!pageData) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <YStack flex={1} bg="$background">
        {messages.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40,
            }}
          >
            <Text color="$gray11" fontSize="$3">
              暂无消息
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }: { item: MessageItem }) => (
              <MessageContextMenu message={item} onReply={handleReply}>
                <MessageBubble message={item} showAvatar={showAvatar} />
              </MessageContextMenu>
            )}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
          />
        )}

        <MessageInput
          placeholder={pageData.inputPlaceholder}
          onSend={handleSend}
          bottomInset={insets.bottom}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}
