import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { XStack, YStack, Text } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import type { HomeLabels, QuickStatsData } from '@/common/typings/home';

interface Props {
  data: QuickStatsData;
  labels: HomeLabels;
}

export default function HomeQuickStats({ data, labels }: Props): ReactNode {
  const items = useMemo(
    (): Array<{ key: keyof QuickStatsData; label: string }> => [
      { key: 'today_amount', label: labels.quick_stats.today },
      { key: 'week_amount', label: labels.quick_stats.week },
      { key: 'month_amount', label: labels.quick_stats.month },
    ],
    [labels.quick_stats],
  );

  const cs = labels.common.currency_symbol;

  return (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <XStack gap="$2">
        {items.map((item) => (
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
                  {cs}
                  {(data[item.key] ?? 0).toLocaleString()}
                </Text>
              </YStack>
            </PikoCard>
          </YStack>
        ))}
      </XStack>
    </Animated.View>
  );
}
