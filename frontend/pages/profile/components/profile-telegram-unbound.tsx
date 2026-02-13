import type { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from 'tamagui';

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
      <TouchableOpacity
        onPress={onBind}
        activeOpacity={0.8}
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {buttonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}
