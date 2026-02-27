import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
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

  return (
    <XStack
      gap="$2"
      style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
    >
      {weekDates.map((date, i) => {
        const key = formatDateKey(date);
        const isSelected = key === selectedKey;
        const marked = markedDates[key];
        const amount = marked?.amount;

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
                borderRadius: 12,
                backgroundColor: isSelected ? theme.gray4?.val : 'transparent',
              }}
            >
              <Text fontSize="$1" color="$gray10">
                {WEEKDAY_LABELS[i]}
              </Text>
              <Text
                fontSize="$5"
                fontWeight={isSelected ? '700' : '500'}
                color={isSelected ? '$color' : '$gray11'}
                mt="$1"
              >
                {date.getDate()}
              </Text>
              {amount != null && amount > 0 ? (
                <Text fontSize="$1" color="$gray10" mt="$1">
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
