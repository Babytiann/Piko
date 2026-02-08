import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacer, YStack, Text } from 'tamagui';

const TAB_BAR_OFFSET = 56 + 16 + 16; // bar height + bottom gap + padding

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} pt={insets.top} pb={insets.bottom + TAB_BAR_OFFSET} px={40} bg="$background">
      <Spacer size="$4" />
      <Text fontSize="$8" fontWeight="700" color="$color" letterSpacing={-0.5}>
        Hello user
      </Text>
      <Text fontSize="$3" color="$gray11" mt="$2">
        欢迎使用，从这里开始你的体验。
      </Text>
    </YStack>
  );
}
