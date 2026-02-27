import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const start = new Date(d);
  start.setDate(d.getDate() - mondayOffset);
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    out.push(x);
  }
  return out;
}

export interface MarkedDateItem {
  dot?: boolean;
  amount?: number;
}

interface PikoWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Record<string, MarkedDateItem>;
}

export function PikoWeekCalendar({
  selectedDate,
  onDateSelect,
  markedDates = {},
}: PikoWeekCalendarProps): ReactNode {
  const theme = useTheme();
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const selectedKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(new Date());

  return (
    <XStack
      gap="$2"
      style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
    >
      {weekDates.map((date, i) => {
        const key = formatDateKey(date);
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;
        const marked = markedDates[key];
        const amount = marked?.amount;
        const hasExpense = amount != null && amount > 0;

        return (
          <Pressable
            key={key}
            onPress={() => onDateSelect(date)}
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
                {WEEKDAY_LABELS[i]}
              </Text>
              <Text
                fontSize={16}
                fontWeight={isSelected || isToday ? '700' : '500'}
                color={isToday ? 'white' : isSelected ? '$color' : '$gray11'}
                mt="$1"
              >
                {date.getDate()}
              </Text>
              {hasExpense ? (
                <Text
                  fontSize={10}
                  color={isToday ? 'rgba(255,255,255,0.7)' : '$gray10'}
                  mt={2}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ¥{amount.toFixed(0)}
                </Text>
              ) : null}
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
