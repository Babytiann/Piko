import { YStack, Text } from 'tamagui';

import type { TelegramSection as TelegramSectionData } from '@/types/profile';
import TelegramBound from './telegram-bound';
import TelegramUnbound from './telegram-unbound';

interface TelegramSectionProps {
  data: TelegramSectionData;
  onBind: () => void;
  onUnbind: () => void;
}

export default function TelegramSection({
  data,
  onBind,
  onUnbind,
}: TelegramSectionProps) {
  return (
    <YStack bg="$gray2" borderRadius="$4" p="$4" gap="$3">
      <Text fontSize="$4" fontWeight="600" color="$color">
        {data.title}
      </Text>

      {data.isLoggedIn && data.user ? (
        <TelegramBound
          user={data.user}
          unbindButtonText={data.unbindButtonText ?? '解除绑定'}
          onUnbind={onUnbind}
        />
      ) : (
        <TelegramUnbound
          prompt={data.bindPrompt ?? ''}
          buttonText={data.bindButtonText ?? '绑定'}
          onBind={onBind}
        />
      )}
    </YStack>
  );
}
