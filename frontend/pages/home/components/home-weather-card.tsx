import type { ReactNode } from 'react';
import { YStack, Text } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import type { WeatherCardData } from '@/common/typings/home';

interface Props {
  data: WeatherCardData;
}

export default function HomeWeatherCard({ data }: Props): ReactNode {
  return (
    <Animated.View entering={FadeInDown.delay(250).springify()}>
      <PikoCard padding="$3" style={{ minHeight: 100 }}>
        <Text fontSize={11} color="$muted">
          {data.city}
        </Text>
        <Text
          fontSize={32}
          fontWeight="800"
          color="$color"
          mt="$1"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {data.temperature}°
        </Text>
        <Text fontSize={11} color="$muted" mt="$1">
          {data.tempMax}° / {data.tempMin}°
        </Text>
        <YStack flexDirection="row" gap="$3" mt="$2">
          {data.humidity != null ? (
            <Text fontSize={10} color="$muted">
              💧 {data.humidity}%
            </Text>
          ) : null}
          {data.windSpeed != null ? (
            <Text fontSize={10} color="$muted">
              🌬 {data.windSpeed} km/h
            </Text>
          ) : null}
        </YStack>
      </PikoCard>
    </Animated.View>
  );
}
