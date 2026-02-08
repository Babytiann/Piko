import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacer, YStack, Text } from 'tamagui';

const TAB_BAR_OFFSET = 56 + 16 + 16;

export default function AIScreen() {
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} pt={insets.top} pb={insets.bottom + TAB_BAR_OFFSET} px="$4" bg="$background">
      <Spacer size="$4" />
      <Text fontSize="$7" fontWeight="600" color="$color">
        个人中心
      </Text>
      <Text fontSize="$3" color="$gray11" mt="$2">
        此页面为个人中心功能入口，后续可在此接入对话或能力。
      </Text>
    </YStack>
  );
}
