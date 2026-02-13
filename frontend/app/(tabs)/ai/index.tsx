import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';
import { useAuth } from '@/common/hooks';

import type { DialogItem } from '@/common/typings/chat';
import { useChatListData } from '@/pages/chat-list/hooks/useChatListData';
import ChatListDialogList from '@/pages/chat-list/components/chat-list-dialog-list';
import ChatListUnboundPrompt from '@/pages/chat-list/components/chat-list-unbound-prompt';

export default function MessagesScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const {
    isLoading,
    isRefreshing,
    errorType,
    data,
    handleRetry,
    handleRefresh,
  } = useChatListData(session);

  const handleDialogPress = (dialog: DialogItem): void => {
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

  if (isLoading) return <PageLoading />;
  if (errorType)
    return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
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
        <ChatListUnboundPrompt
          data={data.unboundState}
          onBind={() => router.push('/telegram_login')}
        />
      ) : (
        <ChatListDialogList
          dialogs={data.dialogs ?? []}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onDialogPress={handleDialogPress}
          contentPaddingBottom={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
        />
      )}
    </YStack>
  );
}
