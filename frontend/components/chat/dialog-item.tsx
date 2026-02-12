import { TouchableOpacity, View } from 'react-native';
import { YStack, Text } from 'tamagui';
import type { DialogItem as DialogItemData } from '@/types/chat';
import Avatar from '@/components/shared/avatar';

interface DialogItemProps {
  dialog: DialogItemData;
  onPress: () => void;
}

export default function DialogItem({ dialog, onPress }: DialogItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className="flex-row px-4 py-3 gap-3 items-center">
        <Avatar text={dialog.avatarText} color={dialog.avatarColor} />

        <YStack flex={1} gap="$1">
          <View className="flex-row justify-between items-center">
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

          <View className="flex-row justify-between items-center">
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
              <View className="min-w-5 h-5 rounded-[10px] bg-[#007AFF] justify-center items-center px-1">
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
