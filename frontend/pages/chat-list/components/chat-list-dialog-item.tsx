import type { ReactNode } from 'react';
import { XStack, YStack, Text, View } from 'tamagui';

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
    <XStack
      px="$3.5"
      py="$2.5"
      gap="$3"
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
      style={{ alignItems: 'center' }}
    >
      <Avatar
        url={dialog.avatar_url}
        text={dialog.avatar_text}
        color={dialog.avatar_color}
      />

      <YStack flex={1} gap="$1">
        <XStack
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
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
            {dialog.last_message_time}
          </Text>
        </XStack>

        <XStack
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text
            fontSize="$2"
            color="$gray11"
            numberOfLines={1}
            flex={1}
            mr="$2"
          >
            {dialog.last_message}
          </Text>
          {dialog.unread_count > 0 ? (
            <View
              bg="#60A5FA"
              px="$1"
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text color="white" fontSize={11} fontWeight="700">
                {dialog.unread_count > 99 ? '99+' : dialog.unread_count}
              </Text>
            </View>
          ) : null}
        </XStack>
      </YStack>
    </XStack>
  );
}
