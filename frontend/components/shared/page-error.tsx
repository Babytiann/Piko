import { TouchableOpacity, StyleSheet } from 'react-native';
import { YStack, Text } from 'tamagui';

interface PageErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      bg="$background"
      px="$4"
    >
      <Text color="$red11" fontSize="$4" fontWeight="600" textAlign="center">
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text color="white" fontWeight="600" fontSize="$3">
            重试
          </Text>
        </TouchableOpacity>
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  retryButton: {
    marginTop: 20,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
