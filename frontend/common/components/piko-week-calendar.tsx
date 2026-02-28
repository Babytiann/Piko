import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface MarkedDateItem {
  dot?: boolean;
  amount?: number;
}

interface PikoWeekCalendarProps {
  /** ISO date string, e.g. "2024-01-15" */
  selectedDate: string;
  onDateSelect: (dateStr: string) => void;
  markedDates?: Record<string, MarkedDateItem>;
  weekdayLabels?: string[];
  currencySymbol?: string;
}

export function PikoWeekCalendar({
  selectedDate,
  onDateSelect,
  markedDates = {},
  weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'],
  currencySymbol = '¥',
}: PikoWeekCalendarProps): ReactNode {
  const theme = useTheme();

  // Stable week-start key — only changes when selectedDate crosses a week boundary
  const weekStartKey = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const dow = d.getDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    d.setDate(d.getDate() - mondayOffset);
    return formatDateKey(d);
  }, [selectedDate]);

  const weekDates = useMemo(() => {
    const monday = new Date(weekStartKey + 'T00:00:00');
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(monday);
      x.setDate(monday.getDate() + i);
      out.push(x);
    }
    return out;
  }, [weekStartKey]);

  const todayKey = formatDateKey(new Date());

  return (
    <XStack
      gap="$2"
      style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
    >
      {weekDates.map((date, i) => {
        const key = formatDateKey(date);
        const isSelected = key === selectedDate;
        const isToday = key === todayKey;
        const marked = markedDates[key];
        const amount = marked?.amount;
        const hasAmount = amount != null;
        const hasExpense = hasAmount && amount > 0;

        return (
          <Pressable
            key={key}
            onPress={() => onDateSelect(key)}
            style={{ flex: 1, minWidth: 40 }}
          >
            <YStack
              flex={1}
              py="$2"
              style={{
                alignItems: 'center',
                borderRadius: 14,
                borderCurve: 'continuous',
                backgroundColor: isToday
                  ? '#11181C'
                  : isSelected
                    ? '#F0F0F0'
                    : hasExpense
                      ? theme.gray3?.val
                      : 'transparent',
              }}
            >
              <Text
                fontSize={11}
                color={isToday ? 'white' : '$gray10'}
                style={{ opacity: 0.7 }}
              >
                {weekdayLabels[i]}
              </Text>
              <Text
                fontSize={16}
                fontWeight={isSelected || isToday ? '700' : '500'}
                color={isToday ? 'white' : isSelected ? '$color' : '$gray11'}
                mt="$1"
              >
                {date.getDate()}
              </Text>
              <Text
                fontSize={10}
                color={isToday ? 'rgba(255,255,255,0.7)' : '$gray10'}
                mt={2}
                style={{
                  fontVariant: ['tabular-nums'],
                  opacity: hasExpense ? 1 : 0.5,
                }}
              >
                {hasExpense
                  ? `${currencySymbol}${amount.toFixed(0)}`
                  : `0${currencySymbol}`}
              </Text>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
