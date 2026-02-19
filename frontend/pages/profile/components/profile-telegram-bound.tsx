import type { ReactNode } from 'react';
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

      <YStack
        height={44}
        bg="$red2"
        pressStyle={{ opacity: 0.8 }}
        onPress={onUnbind}
        style={{
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="$red10" fontWeight="600" fontSize="$3">
          {unbindButtonText}
        </Text>
      </YStack>
    </>
  );
}
