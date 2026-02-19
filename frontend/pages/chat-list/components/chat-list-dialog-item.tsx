import type { ReactNode } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { YStack, Text } from 'tamagui';

import Avatar from '@/common/components/avatar';
import type { DialogItem as DialogItemData } from '@/common/typings/chat';

interface ChatListDialogItemProps {
  dialog: DialogItemData;
  onPress: () => void;
}

export default function ChatListDialogItem({
  dialog,
  onPress,
}: ChatListDialogItemProps): ReactNode {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Avatar
          url={dialog.img_url}
          text={dialog.avatarText}
          color={dialog.avatarColor}
        />

        <YStack flex={1} gap="$1">
          <View style={styles.rowBetween}>
            <Text
              fontSize="$4"
              fontWeight="600"
              color="$color"
              numberOfLines={1}
              flex={1}
              mr="$2"
            >
              {dialog.title}
            </Text>
            <Text fontSize="$1" color="$gray10">
              {dialog.lastMessageTime}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text
              fontSize="$2"
              color="$gray11"
              numberOfLines={1}
              flex={1}
              mr="$2"
            >
              {dialog.lastMessage}
            </Text>
            {dialog.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text color="white" fontSize={11} fontWeight="700">
                  {dialog.unreadCount > 99 ? '99+' : dialog.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </YStack>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
