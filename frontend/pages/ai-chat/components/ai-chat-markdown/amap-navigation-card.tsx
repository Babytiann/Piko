import type { ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { Text, XStack, YStack } from 'tamagui';

interface Props {
  url: string;
  label: string;
}

export default function AmapNavigationCard({ url, label }: Props): ReactNode {
  const displayLabel = label.replace(/🧭\s*/, '');

  const handlePress = async (): Promise<void> => {
    const nativeUrl = url.replace('https://uri.amap.com/', 'amapuri://');
    const canOpen = await Linking.canOpenURL(nativeUrl);
    void Linking.openURL(canOpen ? nativeUrl : url);
  };

  return (
    <YStack
      my="$2"
      px="$3"
      py="$2.5"
      borderWidth={1}
      borderColor="$blue7"
      bg="$blue2"
      pressStyle={{ opacity: 0.8 }}
      onPress={handlePress}
      style={{ borderRadius: 12 }}
    >
      <XStack gap="$2" style={{ alignItems: 'center' }}>
        <Text fontSize={16}>🧭</Text>
        <Text fontSize={14} fontWeight="600" color="$blue11">
          在高德地图中导航
        </Text>
      </XStack>
      <Text
        fontSize={13}
        color="$blue10"
        lineHeight={20}
        mt="$1.5"
        numberOfLines={2}
      >
        {displayLabel}
      </Text>
      <YStack style={{ alignItems: 'flex-end' }} mt="$1">
        <Text fontSize={12} color="$blue8">
          点击打开 &gt;
        </Text>
      </YStack>
    </YStack>
  );
}
