import type { ReactNode } from 'react';
import { XStack, YStack, Text } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import type { QuickStatsData } from '@/common/typings/home';

interface Props {
  data: QuickStatsData;
}

const ITEMS: Array<{ key: keyof QuickStatsData; label: string }> = [
  { key: 'today_amount', label: '今日' },
  { key: 'week_amount', label: '本周' },
  { key: 'month_amount', label: '本月' },
];

export default function HomeQuickStats({ data }: Props): ReactNode {
  return (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <XStack gap="$2">
        {ITEMS.map((item) => (
          <YStack key={item.key} flex={1}>
            <PikoCard padding="$3">
              <YStack style={{ alignItems: 'center' }}>
                <Text fontSize={11} color="$muted">
                  {item.label}
                </Text>
                <Text
                  fontSize={15}
                  fontWeight="700"
                  color="$color"
                  mt="$1"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ¥{(data[item.key] ?? 0).toLocaleString()}
                </Text>
              </YStack>
            </PikoCard>
          </YStack>
        ))}
      </XStack>
    </Animated.View>
  );
}
