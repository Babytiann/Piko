import { useState, useCallback } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import { YStack, XStack, Text, Spacer, View } from 'tamagui';
import { useAuth } from '@/common/hooks';
import usePageData from '@/hooks/usePageData';
import { fetchChatListPage } from '@/service/chat';
import type { ChatListPageData, DialogItem } from '@/common/typings/chat';
import PageLoading from '@/common/components/page-loading';
import PageError from '@/common/components/page-status-view';
import DialogList from '@/components/chat/dialog-list';
import UnboundPrompt from '@/components/chat/unbound-prompt';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { data, loading, error, refresh } = usePageData<ChatListPageData>(
    () => fetchChatListPage(session ?? undefined),
    [session],
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleDialogPress = (dialog: DialogItem) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: dialog.id,
        title: dialog.title,
        chatType: dialog.type,
        accessHash: dialog.accessHash,
      },
    });
  };

  if (loading && !refreshing) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  return (
    <YStack flex={1} pt={insets.top} bg="$background">
      <XStack px="$4" py="$3">
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          letterSpacing={-0.5}
        >
          {data.header.title}
        </Text>
        <Spacer flex={1} />
      </XStack>

      {data.unboundState ? (
        <UnboundPrompt
          data={data.unboundState}
          onBind={() => router.push('/telegram_login')}
        />
      ) : (
        <DialogList
          dialogs={data.dialogs ?? []}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onDialogPress={handleDialogPress}
          contentPaddingBottom={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
        />
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    zIndex: 1,
  },
});
