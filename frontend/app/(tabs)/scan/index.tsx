import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { YStack, Text } from 'tamagui';

/**
 * Scan / 记账 tab — placeholder.
 *
 * Module 3 will replace this with a live camera preview that
 * captures payment screenshots for AI-powered expense recognition.
 */
export default function ScanScreen(): ReactNode {
  const insets = useSafeAreaInsets();

  return (
    <YStack
      flex={1}
      pt={insets.top}
      bg="$background"
      gap="$4"
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="camera-outline" size={64} color="#9BA1A6" />
      <Text fontSize="$6" fontWeight="600" color="$color">
        记账
      </Text>
      <Text
        fontSize="$3"
        color="$gray10"
        px="$6"
        style={{ textAlign: 'center' }}
      >
        拍照识别消费记录，AI 自动归类记账{'\n'}即将在后续课程中开放
      </Text>
    </YStack>
  );
}
