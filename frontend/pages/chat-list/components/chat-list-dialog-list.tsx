import type { ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';

import type { DialogItem as DialogItemData } from '@/common/typings/chat';

import ChatListDialogItem from './chat-list-dialog-item';

const SEPARATOR_LEFT_MARGIN = 78;

function ItemSeparator(): ReactNode {
  return <View style={styles.separator} />;
}

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
        <View style={styles.empty}>
          <Text color="$gray11" fontSize="$3">
            暂无对话
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: SEPARATOR_LEFT_MARGIN,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
