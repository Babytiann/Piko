import { TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';
import type { UnboundState } from '@/common/typings/chat';

interface UnboundPromptProps {
  data: UnboundState;
  onBind: () => void;
}

export default function UnboundPrompt({ data, onBind }: UnboundPromptProps) {
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
        className="mt-5 h-11 px-6 rounded-xl bg-black justify-center items-center"
        onPress={onBind}
        activeOpacity={0.8}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {data.bindButtonText}
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
