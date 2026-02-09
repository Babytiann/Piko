import { ActivityIndicator } from 'react-native';
import { YStack, Text } from 'tamagui';

interface PageLoadingProps {
  message?: string;
}

export default function PageLoading({
  message = '加载中...',
}: PageLoadingProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      bg="$background"
    >
      <ActivityIndicator size="large" />
      <Text color="$gray11" mt="$3" fontSize="$2">
        {message}
      </Text>
    </YStack>
  );
}
