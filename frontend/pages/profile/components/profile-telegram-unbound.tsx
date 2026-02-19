import type { ReactNode } from 'react';
import { YStack, Text } from 'tamagui';

interface ProfileTelegramUnboundProps {
  prompt: string;
  buttonText: string;
  onBind: () => void;
}

export default function ProfileTelegramUnbound({
  prompt,
  buttonText,
  onBind,
}: ProfileTelegramUnboundProps): ReactNode {
  return (
    <>
      <Text fontSize="$2" color="$gray11">
        {prompt}
      </Text>
      <YStack
        height={48}
        bg="$color"
        pressStyle={{ opacity: 0.8 }}
        onPress={onBind}
        style={{
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="$background" fontWeight="600" fontSize="$3">
          {buttonText}
        </Text>
      </YStack>
    </>
  );
}
