import { TouchableOpacity, StyleSheet } from 'react-native';
import { YStack, Text } from 'tamagui';
import type { UnboundState } from '@/types/chat';

interface UnboundPromptProps {
  data: UnboundState;
  onBind: () => void;
}

export default function UnboundPrompt({ data, onBind }: UnboundPromptProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Text color="$gray11" fontSize="$4" fontWeight="600">
        {data.title}
      </Text>
      <Text color="$gray11" fontSize="$2" mt="$2" px="$6" textAlign="center">
        {data.description}
      </Text>
      <TouchableOpacity
        style={styles.button}
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

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
