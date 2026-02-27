import type { ReactNode } from 'react';
import { View, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

export default function AiAvatar(): ReactNode {
  const theme = useTheme();

  return (
    <View
      width={32}
      height={32}
      bg="$gray4"
      style={{
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="sparkles" size={16} color={theme.primary.val} />
    </View>
  );
}
