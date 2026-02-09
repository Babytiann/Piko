import { useRef, useCallback, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import { usePageData } from '@/hooks/usePageData';
import { fetchChatDetailPage } from '@/services/chat';
import type { ChatDetailPageData, MessageItem } from '@/types/chat';
import * as telegramApi from '@/services/telegram';
import PageLoading from '@/components/shared/page-loading';
import PageError from '@/components/shared/page-error';
import MessageBubble from '@/components/chat/message-bubble';
import MessageInput from '@/components/chat/message-input';

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

  const { data, loading, error, refresh } = usePageData<ChatDetailPageData>(
    () =>
      fetchChatDetailPage(
        session ?? '',
        id ?? '',
        chatType ?? 'user',
        accessHash ?? '',
        title ?? 'Chat',
      ),
    [session, id, chatType, accessHash, title],
  );

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: data?.header.title ?? title ?? 'Chat',
    });
  }, [navigation, data?.header.title, title]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!session || !id) return;
      const result = await telegramApi.sendMessage(
        session,
        id,
        chatType ?? 'user',
        accessHash ?? '',
        text,
      );
      if (result.success) {
        await refresh();
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      }
    },
    [session, id, chatType, accessHash, refresh],
  );

  if (loading) return <PageLoading message="加载消息..." />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  // Messages come newest-first from server; reverse for chronological display
  const messages = [...data.messages].reverse();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <YStack flex={1} bg="$background">
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
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
              <MessageBubble message={item} />
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
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
