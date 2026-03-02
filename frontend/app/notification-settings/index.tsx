import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';

const PERMISSION_LABELS: Record<string, string> = {
  granted: '已允许',
  denied: '已关闭',
  undetermined: '未设置',
};

export default function NotificationSettingsScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Notifications.getPermissionsAsync().then(({ status: s }) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

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
            通知设置
          </Text>
        </XStack>

        <YStack px="$4" gap="$4" pt="$2">
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <PikoCard padding="$4">
              <YStack gap="$3">
                <XStack
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    推送通知
                  </Text>
                  <Text fontSize="$3" color="$gray12">
                    {status ? (PERMISSION_LABELS[status] ?? status) : '加载中…'}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$gray12">
                  开启后，你可以收到消费提醒、每日报告等重要通知。如需更改，请前往系统设置。
                </Text>
                <XStack
                  py="$2"
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => Linking.openSettings()}
                >
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    前往系统设置
                  </Text>
                </XStack>
              </YStack>
            </PikoCard>
          </Animated.View>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
