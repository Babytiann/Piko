import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

interface Props {
  url: string;
  label: string;
}

export default function AmapNavigationCard({ url, label }: Props): ReactNode {
  const displayLabel = label.replace(/🧭\s*/, '');

  const handlePress = (): void => {
    void Linking.openURL(url);
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
