import type { ReactNode } from 'react';
import { YStack, Text } from 'tamagui';

import type { UnboundState } from '@/common/typings/chat';

interface ChatListUnboundPromptProps {
  data: UnboundState;
  onBind: () => void;
}

export default function ChatListUnboundPrompt({
  data,
  onBind,
}: ChatListUnboundPromptProps): ReactNode {
  return (
    <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text color="$gray11" fontSize="$4" fontWeight="600">
        {data.title}
      </Text>
      <Text
        color="$gray11"
        fontSize="$2"
        mt="$2"
        px="$6"
        style={{ textAlign: 'center' }}
      >
        {data.description}
      </Text>
      <YStack
        mt="$4"
        height={44}
        px="$5"
        bg="#60A5FA"
        pressStyle={{ opacity: 0.8 }}
        onPress={onBind}
        style={{
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {data.bind_button_text}
        </Text>
      </YStack>
    </YStack>
  );
}
