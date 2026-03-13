import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { PikoRingChart } from '@/common/components/piko-ring-chart';
import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';
import type {
  BudgetCardNodeData,
  BudgetCardData,
  HomeLabels,
} from '@/common/typings/home';
import HomeBudgetEditSheet from './home-budget-edit-sheet';

interface Props {
  data: BudgetCardNodeData;
  labels: HomeLabels;
  onBudgetUpdated?: () => void;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
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

function MiniSparkline({
  data,
  scheme,
}: {
  data: BudgetCardData;
  scheme: ColorScheme;
}): ReactNode {
  const W = 60;
  const H = 24;
  const thisWeek = data.daily_spent ?? [];
  const lastWeek = data.last_week_daily_spent ?? [];

  if (thisWeek.length < 2 && lastWeek.length < 2) return null;

  const thisPath = buildSparklinePath(thisWeek, W, H);
  const lastPath = buildSparklinePath(lastWeek, W, H);
  const colors = getThemeColors(scheme);
  const lastStroke = colors.border;
  const thisStroke = colors.primary;

  return (
    <Svg width={W} height={H}>
      {lastPath ? (
        <Path
          d={lastPath}
          stroke={lastStroke}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="3,3"
        />
      ) : null}
      {thisPath ? (
        <Path d={thisPath} stroke={thisStroke} strokeWidth={2} fill="none" />
      ) : null}
    </Svg>
  );
}

function TrendBadge({
  trendPercent,
  scheme,
}: {
  trendPercent: number;
  scheme: ColorScheme;
}): ReactNode {
  const isDown = trendPercent < 0;
  const colors = getThemeColors(scheme);
  return (
    <XStack style={{ alignItems: 'center', gap: 2 }}>
      <Ionicons
        name={isDown ? 'trending-down' : 'trending-up'}
        size={12}
        color={isDown ? colors.success : colors.destructive}
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

function BudgetCardSetCta({
  onPress,
  labels,
  scheme,
}: {
  onPress: () => void;
  labels: HomeLabels['budget_card'];
  scheme: ColorScheme;
}): ReactNode {
  const ctaColors = getThemeColors(scheme);
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <PikoCard
        padding="$4"
        onPress={onPress}
        style={{ minHeight: 120, justifyContent: 'center' }}
      >
        <YStack style={{ alignItems: 'center', gap: 8 }}>
          <Text fontSize={15} fontWeight="600" color="$gray10">
            {labels.set_cta_title}
          </Text>
          <Text fontSize={12} color="$gray9">
            {labels.set_cta_desc}
          </Text>
          <XStack mt="$2" style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={ctaColors.muted}
            />
            <Text fontSize={14} color="$primary">
              {labels.set_cta_button}
            </Text>
          </XStack>
        </YStack>
      </PikoCard>
    </Animated.View>
  );
}

function BudgetCardContent({
  data,
  labels,
  cs,
  onEditPress,
  scheme,
}: {
  data: BudgetCardData;
  labels: HomeLabels['budget_card'];
  cs: string;
  onEditPress: () => void;
  scheme: ColorScheme;
}): ReactNode {
  const progress = Math.min(1, data.usedPercent / 100);
  const isOverBudget = data.usedPercent > 100;
  const colors = getThemeColors(scheme);

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <PikoCard padding="$3">
        <XStack
          mb="$2"
          pb="$2"
          borderBottomWidth={1}
          borderBottomColor="$gray3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <YStack>
            <XStack style={{ alignItems: 'center', gap: 6 }}>
              <Text fontSize={11} color="$muted">
                {labels.monthly_budget_label}
              </Text>
              <Pressable onPress={onEditPress} hitSlop={8}>
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={colors.muted}
                />
              </Pressable>
            </XStack>
            <Text
              fontSize={20}
              fontWeight="700"
              color="$color"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {cs}
              {data.monthlyBudget.toLocaleString()}
            </Text>
          </YStack>
          <YStack style={{ alignItems: 'flex-end' }}>
            <Text fontSize={11} color="$muted">
              {labels.month_spent_label}
            </Text>
            <Text
              fontSize={14}
              fontWeight="600"
              color={data.monthRemaining <= 0 ? '$destructive' : '$color'}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {cs}
              {data.monthSpent.toLocaleString()}
            </Text>
          </YStack>
        </XStack>

        <XStack
          mb="$2"
          style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <YStack>
            <Text fontSize={11} color="$muted">
              {labels.weekly_budget_label}
            </Text>
            <Text
              fontSize={14}
              fontWeight="600"
              color="$color"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {cs}
              {data.weeklyBudget.toLocaleString()}
            </Text>
          </YStack>
          <YStack style={{ alignItems: 'flex-end', gap: 4 }}>
            {data.trendPercent != null ? (
              <TrendBadge trendPercent={data.trendPercent} scheme={scheme} />
            ) : null}
            <MiniSparkline data={data} scheme={scheme} />
          </YStack>
        </XStack>

        <XStack gap="$3" style={{ alignItems: 'center' }}>
          <PikoRingChart
            progress={progress}
            size={112}
            strokeWidth={15}
            color={isOverBudget ? colors.destructive : colors.primary}
            bgColor={colors.border}
            centerIcon={
              <YStack
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <Text
                  fontSize={20}
                  fontWeight="800"
                  color={isOverBudget ? '$destructive' : '$color'}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {data.usedPercent}%
                </Text>
                <Text fontSize={10} color="$gray10">
                  {labels.week_used_label}
                </Text>
              </YStack>
            }
          />
          <YStack flex={1} gap="$2">
            <YStack>
              <Text fontSize={11} color="$muted">
                {labels.week_spent_label}
              </Text>
              <Text
                fontSize={15}
                fontWeight="700"
                color="$color"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {cs}
                {data.spent.toLocaleString()}
              </Text>
            </YStack>
            <YStack>
              <Text fontSize={11} color="$muted">
                {labels.week_remaining_label}
              </Text>
              <Text
                fontSize={15}
                fontWeight="700"
                color={data.remaining <= 0 ? '$destructive' : '$color'}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {cs}
                {data.remaining.toLocaleString()}
              </Text>
            </YStack>
          </YStack>
        </XStack>

        <XStack
          mt="$3"
          pt="$2"
          borderTopWidth={1}
          borderTopColor="$gray3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text fontSize={12} color="$muted">
            {labels.daily_avg_label}
          </Text>
          <Text
            fontSize={14}
            fontWeight="600"
            color="$color"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {cs}
            {data.dailyAverage.toLocaleString()}
          </Text>
        </XStack>
      </PikoCard>
    </Animated.View>
  );
}

export default function HomeBudgetCard({
  data,
  labels,
  onBudgetUpdated,
  isLoggedIn = true,
  onLoginRequired,
}: Props): ReactNode {
  const router = useRouter();
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const [showEditSheet, setShowEditSheet] = useState(false);
  const bl = labels.budget_card;
  const cl = labels.common;
  const cs = cl.currency_symbol;

  if ('needSetBudget' in data) {
    const handleSetCtaPress = (): void => {
      if (!isLoggedIn && onLoginRequired) {
        onLoginRequired();
      } else {
        router.push('/budget-setup');
      }
    };
    return (
      <BudgetCardSetCta
        onPress={handleSetCtaPress}
        labels={bl}
        scheme={scheme}
      />
    );
  }

  const handleEditPress = (): void => {
    if (!isLoggedIn && onLoginRequired) {
      onLoginRequired();
    } else {
      setShowEditSheet(true);
    }
  };

  return (
    <>
      <BudgetCardContent
        data={data}
        labels={bl}
        cs={cs}
        onEditPress={handleEditPress}
        scheme={scheme}
      />
      <HomeBudgetEditSheet
        visible={showEditSheet}
        currentBudget={data.monthlyBudget}
        labels={labels}
        onClose={() => setShowEditSheet(false)}
        onSaved={() => {
          setShowEditSheet(false);
          onBudgetUpdated?.();
        }}
      />
    </>
  );
}
