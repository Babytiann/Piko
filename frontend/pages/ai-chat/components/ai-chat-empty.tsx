import type { ReactElement } from 'react';
import { YStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle: string;
}

/** Empty state shown when there are no messages yet. */
export default function AiChatEmpty({ title, subtitle }: Props): ReactElement {
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
        {title}
      </Text>
      <Text
        fontSize="$3"
        color="$gray10"
        lineHeight={22}
        style={{ textAlign: 'center' }}
      >
        {subtitle}
      </Text>
    </YStack>
  );
}
