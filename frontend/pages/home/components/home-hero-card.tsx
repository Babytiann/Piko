import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { View, useColorScheme, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { PikoCard } from '@/common/components/piko-card';
import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';
import type {
  HomeLabels,
  QuickStatsData,
  WeatherCardData,
} from '@/common/typings/home';

const PAGE_COUNT = 2;
const CARD_HEIGHT = 90;
const SWIPE_VELOCITY = 300;

const TIMING_CFG = {
  duration: 260,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

interface Props {
  quickStats: QuickStatsData;
  weather: WeatherCardData;
  labels: HomeLabels;
  onWeatherPress?: () => void;
}

function IndicatorLine({
  active,
  scheme,
}: {
  active: boolean;
  scheme: ColorScheme;
}): ReactNode {
  const colors = getThemeColors(scheme);
  const style: ViewStyle = {
    width: active ? 20 : 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: active ? colors.primary : colors.border,
    opacity: active ? 1 : 0.5,
  };
  return <View style={style} />;
}

export default function HomeHeroCard({
  quickStats,
  weather,
  labels,
  onWeatherPress,
}: Props): ReactNode {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const cs = labels.common.currency_symbol;
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;

  const activeIndex = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const [currentPage, setCurrentPage] = useState(0);

  const syncPage = useCallback((v: number) => {
    setCurrentPage(v);
  }, []);

  const openWeatherSheet = useCallback((): void => {
    onWeatherPress?.();
  }, [onWeatherPress]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      const progress = -e.translationX / cardWidth;
      const next = activeIndex.value + progress;
      offsetX.value = Math.max(0, Math.min(PAGE_COUNT - 1, next));
    })
    .onEnd((e) => {
      let next = activeIndex.value;
      const swipedByVelocity = Math.abs(e.velocityX) > SWIPE_VELOCITY;
      const swipedByDistance = Math.abs(e.translationX) > cardWidth * 0.25;

      if (swipedByVelocity || swipedByDistance) {
        if (e.translationX < 0 || e.velocityX < -SWIPE_VELOCITY) {
          next = Math.min(activeIndex.value + 1, PAGE_COUNT - 1);
        } else {
          next = Math.max(activeIndex.value - 1, 0);
        }
      }
      activeIndex.value = next;
      offsetX.value = withTiming(next, TIMING_CFG);
      runOnJS(syncPage)(next);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    if (activeIndex.value === 0 && e.x < cardWidth / 2 && onWeatherPress) {
      runOnJS(openWeatherSheet)();
    }
  });

  const composed = Gesture.Race(pan, tap);

  const page0Style = useAnimatedStyle(() => ({
    opacity: interpolate(
      offsetX.value,
      [0, 0.6, 1],
      [1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          offsetX.value,
          [0, 1],
          [0, -cardWidth * 0.35],
          Extrapolation.CLAMP,
        ),
      },
    ],
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  }));

  const page1Style = useAnimatedStyle(() => ({
    opacity: interpolate(
      offsetX.value,
      [0, 0.4, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          offsetX.value,
          [0, 1],
          [cardWidth * 0.35, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(50).duration(300)}>
      <PikoCard noPadding>
        <GestureDetector gesture={composed}>
          <Animated.View style={{ height: CARD_HEIGHT, overflow: 'hidden' }}>
            <Animated.View style={page0Style}>
              <XStack
                px="$3"
                py="$3"
                height={CARD_HEIGHT}
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <YStack flex={1} gap={2}>
                  <XStack gap="$1.5" style={{ alignItems: 'center' }}>
                    <Ionicons
                      name="cloud-outline"
                      size={16}
                      color={getThemeColors(scheme).muted}
                    />
                    <Text fontSize={13} fontWeight="600" color="$color">
                      {weather.city}
                    </Text>
                    <Text fontSize={11} color="$muted">
                      {weather.description}
                    </Text>
                  </XStack>
                  <XStack gap="$1" style={{ alignItems: 'baseline' }}>
                    <Text
                      fontSize={28}
                      fontWeight="900"
                      color="$color"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {weather.temperature}°
                    </Text>
                    <Text fontSize={11} color="$muted">
                      {weather.tempMin}°/{weather.tempMax}°
                    </Text>
                  </XStack>
                </YStack>
                <YStack style={{ alignItems: 'flex-end' }} gap={2}>
                  <Text fontSize={11} color="$muted">
                    {labels.quick_stats.today}
                  </Text>
                  <Text
                    fontSize={22}
                    fontWeight="800"
                    color="$color"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {cs}
                    {quickStats.today_amount.toLocaleString()}
                  </Text>
                </YStack>
              </XStack>
            </Animated.View>

            <Animated.View style={page1Style}>
              <XStack
                px="$3"
                py="$3"
                gap="$4"
                height={CARD_HEIGHT}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <YStack flex={1} style={{ alignItems: 'center' }} gap={2}>
                  <Text fontSize={11} color="$muted">
                    {labels.quick_stats.week}
                  </Text>
                  <Text
                    fontSize={22}
                    fontWeight="800"
                    color="$color"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {cs}
                    {quickStats.week_amount.toLocaleString()}
                  </Text>
                </YStack>
                <View
                  style={{
                    width: 1,
                    height: 32,
                    backgroundColor: getThemeColors(scheme).border,
                    opacity: 0.5,
                  }}
                />
                <YStack flex={1} style={{ alignItems: 'center' }} gap={2}>
                  <Text fontSize={11} color="$muted">
                    {labels.quick_stats.month}
                  </Text>
                  <Text
                    fontSize={22}
                    fontWeight="800"
                    color="$color"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {cs}
                    {quickStats.month_amount.toLocaleString()}
                  </Text>
                </YStack>
              </XStack>
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        <XStack
          gap={6}
          pb="$2"
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <IndicatorLine key={i} active={currentPage === i} scheme={scheme} />
          ))}
        </XStack>
      </PikoCard>
    </Animated.View>
  );
}
