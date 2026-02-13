import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import type { DialogItem as DialogItemData } from '@/common/typings/chat';
import DialogItem from './dialog-item';

// Telegram-style separator: left margin aligns with the text area
// padding(16) + avatar(50) + gap(12) = 78
const SEPARATOR_LEFT_MARGIN = 78;

function ItemSeparator() {
  return <View style={styles.separator} />;
}

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
      ItemSeparatorComponent={ItemSeparator}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center py-10">
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
});
