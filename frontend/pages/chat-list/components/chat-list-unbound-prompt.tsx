import type { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
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
      <TouchableOpacity
        onPress={onBind}
        activeOpacity={0.8}
        style={{
          marginTop: 20,
          height: 44,
          paddingHorizontal: 24,
          borderRadius: 12,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {data.bindButtonText}
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
