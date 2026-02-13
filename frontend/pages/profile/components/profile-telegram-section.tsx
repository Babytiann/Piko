import type { ReactNode } from 'react';
import { YStack, Text } from 'tamagui';

import type { TelegramSection as TelegramSectionData } from '@/common/typings/profile';

import ProfileTelegramBound from './profile-telegram-bound';
import ProfileTelegramUnbound from './profile-telegram-unbound';

interface ProfileTelegramSectionProps {
  data: TelegramSectionData;
  onBind: () => void;
  onUnbind: () => void;
}

export default function ProfileTelegramSection({
  data,
  onBind,
  onUnbind,
}: ProfileTelegramSectionProps): ReactNode {
  return (
    <YStack bg="#FFFFFF" p="$4" gap="$3" style={{ borderRadius: 16 }}>
      <Text fontSize="$4" fontWeight="600" color="$color">
        {data.title}
      </Text>

      {data.isLoggedIn && data.user ? (
        <ProfileTelegramBound
          user={data.user}
          unbindButtonText={data.unbindButtonText ?? '解除绑定'}
          onUnbind={onUnbind}
        />
      ) : (
        <ProfileTelegramUnbound
          prompt={data.bindPrompt ?? ''}
          buttonText={data.bindButtonText ?? '绑定'}
          onBind={onBind}
        />
      )}
    </YStack>
  );
}
