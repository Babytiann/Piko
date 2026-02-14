import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';

import { useAuth } from '@/common/hooks';
import PageLoading from '@/common/components/page-loading';
import PageStatusView, {
  PageErrorType,
} from '@/common/components/page-status-view';

import type { MessageItem } from '@/common/typings/chat';
import * as telegramApi from '@/services/telegram';
import { fetchChatDetailPage } from '@/services/chat';
import { MULTI_SENDER_TYPES } from '@/pages/chat-detail/consts';
import { useChatDetailData } from '@/pages/chat-detail/hooks/useChatDetailData';
import { useChatPolling } from '@/pages/chat-detail/hooks/useChatPolling';
import ChatDetailMessageBubble from '@/pages/chat-detail/components/chat-detail-message-bubble';
import ChatDetailMessageInput from '@/pages/chat-detail/components/chat-detail-message-input';
import ChatDetailContextMenu from '@/pages/chat-detail/components/chat-detail-context-menu';

export default function ChatScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { id, title, chatType, accessHash } = useLocalSearchParams<{
    id: string;
    title?: string;
    chatType?: string;
    accessHash?: string;
  }>();
  const { session, logout } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);

  const chatParams = {
    session,
    chatId: id ?? '',
    chatType: chatType ?? 'user',
    accessHash: accessHash ?? '',
    title: title ?? 'Chat',
  };

  const showAvatar = MULTI_SENDER_TYPES.has(chatParams.chatType);

  // ---- Data Hook: initial load + message state ----------------------------

  const {
    isLoading,
    errorType,
    pageData,
    messages,
    loadingMore,
    handleRetry,
    handleLoadMore,
    mergeMessages,
    prependOptimistic,
  } = useChatDetailData(chatParams);

  // ---- Effect Hook: background polling ------------------------------------

  useChatPolling(chatParams, mergeMessages);

  // ---- Auth expired detection ---------------------------------------------

  useEffect(() => {
    if (errorType !== PageErrorType.AUTH) return;

    Alert.alert(
      '登录已失效',
      'Telegram 登录已失效，请重新绑定账号。',
      [
        {
          text: '确定',
          onPress: async () => {
            await logout();
            router.back();
          },
        },
      ],
      { cancelable: false },
    );
  }, [errorType, logout, router]);

  // ---- Navigation title ---------------------------------------------------

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: pageData?.header.title ?? title ?? 'Chat',
    });
  }, [navigation, pageData?.header.title, title]);

  // ---- Send with optimistic update ---------------------------------------

  const handleSend = async (text: string): Promise<void> => {
    if (!session || !id) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const optimisticMsg: MessageItem = {
      id: Date.now(),
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

    prependOptimistic(optimisticMsg);
    setReplyTo(null);

    setTimeout(
      () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }),
      50,
    );

    try {
      await telegramApi.sendMessage(
        session,
        id,
        chatParams.chatType,
        chatParams.accessHash,
        text,
        replyTo?.id,
      );
    } catch {
      // On failure the next poll will reconcile
    }

    try {
      const response = await fetchChatDetailPage(
        session,
        id,
        chatParams.chatType,
        chatParams.accessHash,
        chatParams.title,
      );
      if (response.success && response.data) {
        mergeMessages(response.data.messages);
      }
    } catch {
      // Swallow — next poll will reconcile
    }
  };

  // ---- Render -------------------------------------------------------------

  if (isLoading) return <PageLoading />;
  if (errorType && errorType !== PageErrorType.AUTH)
    return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
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
              <ChatDetailContextMenu
                message={item}
                onReply={(msg) => setReplyTo(msg)}
              >
                <ChatDetailMessageBubble
                  message={item}
                  showAvatar={showAvatar}
                />
              </ChatDetailContextMenu>
            )}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" />
                </View>
              ) : null
            }
          />
        )}

        <ChatDetailMessageInput
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
