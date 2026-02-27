import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { PikoRingChart } from '@/common/components/piko-ring-chart';
import { SUCCESS, DESTRUCTIVE, MUTED } from '@/common/consts/theme';
import type { BudgetCardNodeData, BudgetCardData } from '@/common/typings/home';
import HomeBudgetEditSheet from './home-budget-edit-sheet';

interface Props {
  data: BudgetCardNodeData;
  onBudgetUpdated?: () => void;
}

function buildSparklinePath(
  values: number[],
  width: number,
  height: number,
): string {
  if (values.length < 2) return '';
  const max = Math.max(...values, 1);
  const stepX = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function MiniSparkline({ data }: { data: BudgetCardData }): ReactNode {
  const W = 60;
  const H = 24;
  const thisWeek = data.daily_spent ?? [];
  const lastWeek = data.last_week_daily_spent ?? [];

  if (thisWeek.length < 2 && lastWeek.length < 2) return null;

  const thisPath = buildSparklinePath(thisWeek, W, H);
  const lastPath = buildSparklinePath(lastWeek, W, H);

  return (
    <Svg width={W} height={H}>
      {lastPath ? (
        <Path
          d={lastPath}
          stroke="#D4D4D8"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="3,3"
        />
      ) : null}
      {thisPath ? (
        <Path d={thisPath} stroke="#11181C" strokeWidth={2} fill="none" />
      ) : null}
    </Svg>
  );
}

function TrendBadge({ trendPercent }: { trendPercent: number }): ReactNode {
  const isDown = trendPercent < 0;
  return (
    <XStack
      style={{
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: isDown ? '#F0FDF4' : '#FEF2F2',
      }}
    >
      <Ionicons
        name={isDown ? 'trending-down' : 'trending-up'}
        size={12}
        color={isDown ? SUCCESS : DESTRUCTIVE}
      />
      <Text
        fontSize={11}
        fontWeight="600"
        color={isDown ? '$success' : '$destructive'}
      >
        {Math.abs(trendPercent)}%
      </Text>
    </XStack>
  );
}

function BudgetCardSetCta({ onPress }: { onPress: () => void }): ReactNode {
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <PikoCard
        padding="$4"
        onPress={onPress}
        style={{ minHeight: 120, justifyContent: 'center' }}
      >
        <YStack style={{ alignItems: 'center', gap: 8 }}>
          <Text fontSize={15} fontWeight="600" color="$gray10">
            设置本周预算
          </Text>
          <Text fontSize={12} color="$gray9">
            设置后即可查看预算使用情况
          </Text>
          <XStack mt="$2" style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons name="add-circle-outline" size={20} color={MUTED} />
            <Text fontSize={14} color="$primary">
              去设置
            </Text>
          </XStack>
        </YStack>
      </PikoCard>
    </Animated.View>
  );
}

function BudgetCardContent({
  data,
  onEditPress,
}: {
  data: BudgetCardData;
  onEditPress: () => void;
}): ReactNode {
  const progress = Math.min(1, data.usedPercent / 100);

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <PikoCard padding="$3" onPress={onEditPress}>
        <XStack
          mb="$2"
          style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <YStack>
            <Text fontSize={11} color="$muted">
              本周预算
            </Text>
            <Text
              fontSize={16}
              fontWeight="700"
              color="$color"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              ¥{data.weeklyBudget.toLocaleString()}
            </Text>
          </YStack>
          <YStack style={{ alignItems: 'flex-end', gap: 4 }}>
            {data.trendPercent != null ? (
              <TrendBadge trendPercent={data.trendPercent} />
            ) : null}
            <MiniSparkline data={data} />
          </YStack>
        </XStack>

        <XStack gap="$3" style={{ alignItems: 'center' }}>
          <PikoRingChart
            progress={progress}
            size={112}
            strokeWidth={15}
            centerIcon={
              <YStack
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <Text
                  fontSize={20}
                  fontWeight="800"
                  color="$color"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {data.usedPercent}%
                </Text>
                <Text fontSize={10} color="$gray10">
                  已使用
                </Text>
              </YStack>
            }
          />
          <YStack flex={1} gap="$2">
            <YStack>
              <Text fontSize={11} color="$muted">
                已花费
              </Text>
              <Text
                fontSize={15}
                fontWeight="700"
                color="$color"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                ¥{data.spent.toLocaleString()}
              </Text>
            </YStack>
            <YStack>
              <Text fontSize={11} color="$muted">
                剩余预算
              </Text>
              <Text
                fontSize={15}
                fontWeight="700"
                color={data.remaining <= 0 ? '$destructive' : '$color'}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                ¥{data.remaining.toLocaleString()}
              </Text>
            </YStack>
          </YStack>
        </XStack>

        <XStack
          mt="$3"
          pt="$2"
          borderTopWidth={1}
          borderTopColor="$gray4"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text fontSize={12} color="$muted">
            日均消费
          </Text>
          <Text
            fontSize={14}
            fontWeight="600"
            color="$color"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            ¥{data.dailyAverage.toLocaleString()}
          </Text>
        </XStack>
      </PikoCard>
    </Animated.View>
  );
}

export default function HomeBudgetCard({
  data,
  onBudgetUpdated,
}: Props): ReactNode {
  const router = useRouter();
  const [showEditSheet, setShowEditSheet] = useState(false);

  if ('needSetBudget' in data) {
    return <BudgetCardSetCta onPress={() => router.push('/budget-setup')} />;
  }

  return (
    <>
      <BudgetCardContent
        data={data}
        onEditPress={() => setShowEditSheet(true)}
      />
      <HomeBudgetEditSheet
        visible={showEditSheet}
        currentBudget={data.weeklyBudget}
        onClose={() => setShowEditSheet(false)}
        onSaved={() => {
          setShowEditSheet(false);
          onBudgetUpdated?.();
        }}
      />
    </>
  );
}
