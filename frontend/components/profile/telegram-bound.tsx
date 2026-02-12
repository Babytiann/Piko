import { TouchableOpacity } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import type { ProfileUser } from '@/types/profile';
import Avatar from '@/components/shared/avatar';

interface TelegramBoundProps {
  user: ProfileUser;
  unbindButtonText: string;
  onUnbind: () => void;
}

export default function TelegramBound({
  user,
  unbindButtonText,
  onUnbind,
}: TelegramBoundProps) {
  return (
    <>
      <XStack gap="$3" items="center">
        <Avatar
          url={user.avatarUrl}
          text={user.avatarText}
          color={user.avatarColor}
        />
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {user.displayName}
          </Text>
          {user.username ? (
            <Text fontSize="$2" color="$gray11">
              {user.username}
            </Text>
          ) : null}
          {user.phone ? (
            <Text fontSize="$2" color="$gray11">
              {user.phone}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      <TouchableOpacity
        className="h-11 rounded-xl bg-red-500/10 justify-center items-center"
        onPress={onUnbind}
        activeOpacity={0.8}
      >
        <Text color="#FF3B30" fontWeight="600" fontSize="$3">
          {unbindButtonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}
