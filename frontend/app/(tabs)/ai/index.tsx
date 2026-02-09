import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import { useChatListPage } from '@/hooks/useChatListPage';
import type { DialogItem } from '@/types/chat';
import PageLoading from '@/components/shared/page-loading';
import PageError from '@/components/shared/page-error';
import DialogList from '@/components/chat/dialog-list';
import UnboundPrompt from '@/components/chat/unbound-prompt';

const TAB_BAR_OFFSET = 56 + 16 + 16;

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { data, loading, error, refresh } = useChatListPage(session);
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

  if (loading && !refreshing) return <PageLoading message="加载对话列表..." />;
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
          contentPaddingBottom={insets.bottom + TAB_BAR_OFFSET}
        />
      )}
    </YStack>
  );
}
