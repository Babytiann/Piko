import type { ReactElement } from 'react';
import { YStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

/** Empty state shown when there are no messages yet. */
export default function AiChatEmpty(): ReactElement {
  return (
    <YStack
      flex={1}
      gap="$3"
      px="$6"
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="sparkles-outline" size={48} color="#9BA1A6" />
      <Text
        fontSize="$5"
        fontWeight="600"
        color="$color"
        style={{ textAlign: 'center' }}
      >
        Hi，我是 Piko AI
      </Text>
      <Text
        fontSize="$3"
        color="$gray10"
        lineHeight={22}
        style={{ textAlign: 'center' }}
      >
        问我任何问题，我会尽力帮你解答。
      </Text>
    </YStack>
  );
}
