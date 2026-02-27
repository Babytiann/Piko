import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { PikoWeekCalendar } from '@/common/components/piko-week-calendar';
import { MUTED } from '@/common/consts/theme';
import type { WeekCalendarData } from '@/common/typings/home';

interface Props {
  data: WeekCalendarData;
  onWeekChange?: (dateInTargetWeek: string) => void;
}

export default function HomeWeekCalendar({
  data,
  onWeekChange,
}: Props): ReactNode {
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date(data.selectedDate),
  );

  const markedDates = useMemo(() => {
    const out: Record<string, { amount?: number }> = {};
    for (const d of data.days) {
      out[d.date] = { amount: d.amount };
    }
    return out;
  }, [data.days]);

  const navigateWeek = (direction: -1 | 1): void => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction * 7);
    setSelectedDate(next);
    const iso = next.toISOString().slice(0, 10);
    onWeekChange?.(iso);
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <PikoCard>
        <XStack
          mb="$3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <YStack>
            <Text fontSize={11} color="$muted">
              {data.weekLabel}
            </Text>
            <Text fontSize={16} fontWeight="700" color="$color">
              本周概览
            </Text>
          </YStack>
          <XStack gap="$1" style={{ alignItems: 'center' }}>
            <Pressable
              onPress={() => navigateWeek(-1)}
              hitSlop={8}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={16} color={MUTED} />
            </Pressable>
            <Pressable
              onPress={() => navigateWeek(1)}
              hitSlop={8}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </Pressable>
          </XStack>
        </XStack>
        <PikoWeekCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          markedDates={markedDates}
        />
      </PikoCard>
    </Animated.View>
  );
}
