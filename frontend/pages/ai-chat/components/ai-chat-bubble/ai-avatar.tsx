import type { ReactNode } from 'react';
import { View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

export default function AiAvatar(): ReactNode {
  return (
    <View
      width={32}
      height={32}
      bg="$card"
      style={{
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="sparkles" size={16} color="#60A5FA" />
    </View>
  );
}
