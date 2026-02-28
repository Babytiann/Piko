import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { PikoWeekCalendar } from '@/common/components/piko-week-calendar';
import { MUTED } from '@/common/consts/theme';
import type { HomeLabels, WeekCalendarData } from '@/common/typings/home';

import HomeDatePickerSheet from './home-date-picker-sheet';

interface Props {
  data: WeekCalendarData;
  labels: HomeLabels;
  onWeekChange?: (dateInTargetWeek: string) => void;
  onDateSelect?: (dateStr: string) => void;
  selectedDate?: string;
}

export default function HomeWeekCalendar({
  data,
  labels,
  onWeekChange,
  onDateSelect: onDateSelectProp,
  selectedDate: selectedDateProp,
}: Props): ReactNode {
  const effectiveDate = selectedDateProp ?? data.selectedDate;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const markedDates = useMemo(() => {
    const out: Record<string, { amount?: number }> = {};
    for (const d of data.days) {
      out[d.date] = { amount: d.amount };
    }
    return out;
  }, [data.days]);

  const navigateWeek = (direction: -1 | 1): void => {
    const d = new Date(effectiveDate + 'T00:00:00');
    d.setDate(d.getDate() + direction * 7);
    const iso = d.toISOString().slice(0, 10);
    onDateSelectProp?.(iso);
    onWeekChange?.(iso);
  };

  const handleDateSelect = useCallback(
    (dateStr: string): void => {
      onDateSelectProp?.(dateStr);
    },
    [onDateSelectProp],
  );

  const handlePickerSelect = (dateStr: string): void => {
    setShowDatePicker(false);
    const currentWeekDates = data.days.map((d) => d.date);
    const isInCurrentWeek = currentWeekDates.includes(dateStr);
    onDateSelectProp?.(dateStr);
    if (!isInCurrentWeek) {
      onWeekChange?.(dateStr);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <PikoCard>
        <XStack
          mb="$3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pressable onPress={() => setShowDatePicker(true)}>
            <YStack>
              <Text fontSize={11} color="$muted">
                {data.weekLabel}
              </Text>
              <XStack style={{ alignItems: 'center', gap: 4 }}>
                <Text fontSize={16} fontWeight="700" color="$color">
                  {labels.week_calendar.title}
                </Text>
                <Ionicons name="calendar-outline" size={14} color={MUTED} />
              </XStack>
            </YStack>
          </Pressable>
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
          selectedDate={effectiveDate}
          onDateSelect={handleDateSelect}
          markedDates={markedDates}
          weekdayLabels={labels.week_calendar.weekday_labels}
          currencySymbol={labels.common.currency_symbol}
        />
      </PikoCard>

      <HomeDatePickerSheet
        visible={showDatePicker}
        currentDate={effectiveDate}
        onSelect={handlePickerSelect}
        onClose={() => setShowDatePicker(false)}
        labels={labels.week_calendar}
      />
    </Animated.View>
  );
}
