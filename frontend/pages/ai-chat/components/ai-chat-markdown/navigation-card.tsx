import type { ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { Text, XStack, YStack } from 'tamagui';

type NavigationVariant = 'amap' | 'google-maps';

interface Props {
  variant: NavigationVariant;
  url: string;
  label: string;
  amapTitle?: string;
  googleTitle?: string;
  openHint?: string;
}

interface VariantConfig {
  emoji: string;
  emojiRegex: RegExp;
  titleKey: 'amapTitle' | 'googleTitle';
  fallbackTitle: string;
  borderColor: string;
  bgColor: string;
  titleColor: string;
  labelColor: string;
  hintColor: string;
  urlTransform: (url: string) => string;
}

const VARIANT_CONFIG: Record<NavigationVariant, VariantConfig> = {
  amap: {
    emoji: '🧭',
    emojiRegex: /🧭\s*/,
    titleKey: 'amapTitle',
    fallbackTitle: '在高德地图中导航',
    borderColor: '$blue7',
    bgColor: '$blue2',
    titleColor: '$blue11',
    labelColor: '$blue10',
    hintColor: '$blue8',
    urlTransform: (url: string): string =>
      url.replace('https://uri.amap.com/', 'amapuri://'),
  },
  'google-maps': {
    emoji: '📍',
    emojiRegex: /📍\s*/,
    titleKey: 'googleTitle',
    fallbackTitle: '在 Google Maps 中导航',
    borderColor: '$green7',
    bgColor: '$green2',
    titleColor: '$green11',
    labelColor: '$green10',
    hintColor: '$green8',
    urlTransform: (url: string): string =>
      url.replace('https://www.google.com/maps/', 'comgooglemaps://'),
  },
};

export default function NavigationCard({
  variant,
  url,
  label,
  amapTitle,
  googleTitle,
  openHint,
}: Props): ReactNode {
  const config = VARIANT_CONFIG[variant];
  const displayLabel = label.replace(config.emojiRegex, '');
  const titles: Record<string, string | undefined> = { amapTitle, googleTitle };
  const title = titles[config.titleKey] || config.fallbackTitle;
  const hint = openHint || '点击打开 >';

  const handlePress = async (): Promise<void> => {
    const nativeUrl = config.urlTransform(url);
    const canOpen = await Linking.canOpenURL(nativeUrl);
    void Linking.openURL(canOpen ? nativeUrl : url);
  };

  return (
    <YStack
      my="$2"
      px="$3"
      py="$2.5"
      borderWidth={1}
      borderColor={config.borderColor}
      bg={config.bgColor}
      pressStyle={{ opacity: 0.8 }}
      onPress={handlePress}
      style={{ borderRadius: 12 }}
    >
      <XStack gap="$2" style={{ alignItems: 'center' }}>
        <Text fontSize={16}>{config.emoji}</Text>
        <Text fontSize={14} fontWeight="600" color={config.titleColor}>
          {title}
        </Text>
      </XStack>
      <Text
        fontSize={13}
        color={config.labelColor}
        lineHeight={20}
        mt="$1.5"
        numberOfLines={2}
      >
        {displayLabel}
      </Text>
      <YStack style={{ alignItems: 'flex-end' }} mt="$1">
        <Text fontSize={12} color={config.hintColor}>
          {hint}
        </Text>
      </YStack>
    </YStack>
  );
}
