import type { ReactNode } from 'react';
import { ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';

const X_LINK_PLACEHOLDER = 'https://x.com';
const MAILTO_PLACEHOLDER = 'mailto:support@example.com';

export default function ContactUsScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? '';

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={padding}
        showsVerticalScrollIndicator={false}
      >
        <XStack px="$4" py="$3" gap="$2" style={{ alignItems: 'center' }}>
          <XStack
            style={{ paddingVertical: 8, paddingRight: 8 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.color.val} />
          </XStack>
          <Text fontSize="$6" fontWeight="700" color="$color">
            联系我们
          </Text>
        </XStack>

        <YStack px="$4" gap="$4" pt="$2">
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <PikoCard padding="$4">
              <YStack gap="$3">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  关注我们
                </Text>
                <XStack
                  py="$3"
                  style={{
                    alignItems: 'center',
                    gap: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '$gray4',
                  }}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => Linking.openURL(X_LINK_PLACEHOLDER)}
                >
                  <Ionicons
                    name="logo-twitter"
                    size={22}
                    color={theme.muted.val}
                  />
                  <Text fontSize="$4" color="$color">
                    X (Twitter)
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.muted.val}
                  />
                </XStack>
                <Text fontSize="$2" color="$gray12">
                  可在 X 上获取更新与反馈，链接可按需替换为你的账号。
                </Text>
              </YStack>
            </PikoCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <PikoCard padding="$4">
              <YStack gap="$3">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  邮件反馈
                </Text>
                <XStack
                  py="$2"
                  style={{ alignItems: 'center' }}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => Linking.openURL(MAILTO_PLACEHOLDER)}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={theme.muted.val}
                  />
                  <Text fontSize="$4" color="$color" ml="$2">
                    发送邮件
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$gray12">
                  点击将打开系统邮件应用，可替换为你的联系邮箱。
                </Text>
              </YStack>
            </PikoCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <PikoCard padding="$4">
              <YStack gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  应用信息
                </Text>
                <XStack
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text fontSize="$3" color="$gray12">
                    版本
                  </Text>
                  <Text fontSize="$4" color="$color">
                    {version}
                  </Text>
                </XStack>
                {sdkVersion ? (
                  <XStack
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text fontSize="$3" color="$gray12">
                      Expo SDK
                    </Text>
                    <Text fontSize="$4" color="$color">
                      {sdkVersion}
                    </Text>
                  </XStack>
                ) : null}
              </YStack>
            </PikoCard>
          </Animated.View>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
