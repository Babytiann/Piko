import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { PikoCard } from '@/common/components/piko-card';
import { PikoRingChart } from '@/common/components/piko-ring-chart';
import type { BudgetCardNodeData } from '@/common/typings/home';

interface Props {
  data: BudgetCardNodeData;
}

function BudgetCardSetCta(): ReactNode {
  const router = useRouter();
  return (
    <PikoCard
      padding="$4"
      onPress={() => router.push('/budget-setup')}
      style={{ minHeight: 120, justifyContent: 'center' }}
    >
      <YStack style={{ alignItems: 'center', gap: 8 }}>
        <Text fontSize="$4" fontWeight="600" color="$gray10">
          设置本周预算
        </Text>
        <Text fontSize="$2" color="$gray9">
          设置后即可查看预算使用情况
        </Text>
        <XStack mt="$2" style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="add-circle-outline" size={20} color="#687076" />
          <Text fontSize="$3" color="$blue10">
            去设置
          </Text>
        </XStack>
      </YStack>
    </PikoCard>
  );
}

function BudgetCardContent({
  data,
}: {
  data: Exclude<BudgetCardNodeData, { needSetBudget: true }>;
}): ReactNode {
  const progress = Math.min(1, data.usedPercent / 100);
  return (
    <PikoCard padding="$3">
      <XStack
        mb="$2"
        style={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text fontSize="$3" fontWeight="600" color="$color">
          本周预算
        </Text>
        <XStack style={{ alignItems: 'center', gap: 4 }}>
          <Text fontSize="$3" color="$gray10">
            ¥{data.weeklyBudget.toLocaleString()}
          </Text>
          {data.trendPercent != null ? (
            <XStack style={{ alignItems: 'center', gap: 2 }}>
              <Ionicons
                name={data.trendPercent >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={data.trendPercent >= 0 ? '#34C759' : '#FF3B30'}
              />
              <Text
                fontSize="$1"
                color={data.trendPercent >= 0 ? '#34C759' : '#FF3B30'}
              >
                {data.trendPercent >= 0 ? '+' : ''}
                {data.trendPercent}%
              </Text>
            </XStack>
          ) : null}
        </XStack>
      </XStack>
      <XStack gap="$4" style={{ alignItems: 'center' }}>
        <PikoRingChart
          progress={progress}
          size={100}
          strokeWidth={8}
          centerIcon={
            <YStack style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text fontSize="$6" fontWeight="700" color="$color">
                {data.usedPercent}%
              </Text>
              <Text fontSize="$1" color="$gray10">
                已使用
              </Text>
            </YStack>
          }
        />
        <YStack flex={1} gap="$1">
          <Text fontSize="$2" color="$gray10">
            已花费 ¥{data.spent.toFixed(2)}
          </Text>
          <Text fontSize="$2" color="$gray10">
            剩余预算 ¥{data.remaining.toFixed(2)}
          </Text>
        </YStack>
      </XStack>
      <XStack mt="$3" pt="$2" borderTopWidth={1} borderTopColor="$gray4">
        <Text fontSize="$2" color="$gray10">
          日均消费
        </Text>
        <Text fontSize="$3" fontWeight="600" color="$color" ml="$2">
          ¥{data.dailyAverage.toFixed(2)}
        </Text>
      </XStack>
    </PikoCard>
  );
}

export default function HomeBudgetCard({ data }: Props): ReactNode {
  if ('needSetBudget' in data) {
    return <BudgetCardSetCta />;
  }
  return <BudgetCardContent data={data} />;
}
