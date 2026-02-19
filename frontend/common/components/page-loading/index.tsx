import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';

export default function PageLoading(): ReactNode {
  return (
    <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </YStack>
  );
}
