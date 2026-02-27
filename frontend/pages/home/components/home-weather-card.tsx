import type { ReactNode } from 'react';
import { YStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';
import { WEATHER_CARD_GRADIENT } from '@/common/consts/theme';
import type { WeatherCardData } from '@/common/typings/home';

interface Props {
  data: WeatherCardData;
}

export default function HomeWeatherCard({ data }: Props): ReactNode {
  return (
    <PikoCard
      padding="$3"
      style={{ backgroundColor: WEATHER_CARD_GRADIENT[0], minHeight: 100 }}
    >
      <Text fontSize="$2" color="$muted">
        {data.city}
      </Text>
      <Text fontSize="$8" fontWeight="700" color="$color" mt="$1">
        {data.temperature}°
      </Text>
      <Text fontSize="$2" color="$muted" mt="$1">
        {data.tempMax}° / {data.tempMin}°
      </Text>
      <YStack flexDirection="row" gap="$3" mt="$2">
        {data.humidity != null ? (
          <Text fontSize="$1" color="$muted">
            湿度 {data.humidity}%
          </Text>
        ) : null}
        {data.windSpeed != null ? (
          <Text fontSize="$1" color="$muted">
            风速 {data.windSpeed} km/h
          </Text>
        ) : null}
      </YStack>
    </PikoCard>
  );
}
