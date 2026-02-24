import type { ReactElement } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { YStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle: string;
}

export default function AiChatEmpty({ title, subtitle }: Props): ReactElement {
  const theme = useTheme();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <YStack
        flex={1}
        gap="$3"
        px="$6"
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="sparkles-outline" size={48} color={theme.gray9.val} />
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
    </TouchableWithoutFeedback>
  );
}
