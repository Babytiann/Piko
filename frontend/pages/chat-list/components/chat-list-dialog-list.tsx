import type { ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Text, View, YStack } from 'tamagui';

import type { DialogItem as DialogItemData } from '@/common/typings/chat';

import ChatListDialogItem from './chat-list-dialog-item';

const SEPARATOR_LEFT_MARGIN = 78;

const ItemSeparator = (): ReactNode => (
  <View
    height={StyleSheet.hairlineWidth}
    bg="$gray5"
    style={{ marginLeft: SEPARATOR_LEFT_MARGIN }}
  />
);

interface ChatListDialogListProps {
  dialogs: DialogItemData[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onDialogPress: (dialog: DialogItemData) => void;
  contentPaddingBottom?: number;
}

export default function ChatListDialogList({
  dialogs,
  isRefreshing,
  onRefresh,
  onDialogPress,
  contentPaddingBottom = 0,
}: ChatListDialogListProps): ReactNode {
  return (
    <FlatList
      data={dialogs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatListDialogItem dialog={item} onPress={() => onDialogPress(item)} />
      )}
      ItemSeparatorComponent={ItemSeparator}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      ListEmptyComponent={
        <YStack
          py="$8"
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Text color="$gray11" fontSize="$3">
            暂无对话
          </Text>
        </YStack>
      }
    />
  );
}
