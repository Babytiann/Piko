import type { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';

import Avatar from '@/common/components/avatar';
import type { ProfileUser } from '@/common/typings/profile';

interface ProfileTelegramBoundProps {
  user: ProfileUser;
  unbindButtonText: string;
  onUnbind: () => void;
}

export default function ProfileTelegramBound({
  user,
  unbindButtonText,
  onUnbind,
}: ProfileTelegramBoundProps): ReactNode {
  return (
    <>
      <XStack gap="$3" style={{ alignItems: 'center' }}>
        <Avatar
          url={user.img_url}
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
        onPress={onUnbind}
        activeOpacity={0.8}
        style={{
          height: 44,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="#FF3B30" fontWeight="600" fontSize="$3">
          {unbindButtonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}
