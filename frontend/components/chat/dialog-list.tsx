import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import type { DialogItem as DialogItemData } from '@/types/chat';
import DialogItem from './dialog-item';

interface DialogListProps {
  dialogs: DialogItemData[];
  refreshing: boolean;
  onRefresh: () => void;
  onDialogPress: (dialog: DialogItemData) => void;
  contentPaddingBottom?: number;
}

export default function DialogList({
  dialogs,
  refreshing,
  onRefresh,
  onDialogPress,
  contentPaddingBottom = 0,
}: DialogListProps) {
  return (
    <FlatList
      data={dialogs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <DialogItem dialog={item} onPress={() => onDialogPress(item)} />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
