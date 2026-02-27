import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { XStack, YStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';
import { PikoWeekCalendar } from '@/common/components/piko-week-calendar';
import type { WeekCalendarData } from '@/common/typings/home';

interface Props {
  data: WeekCalendarData;
}

export default function HomeWeekCalendar({ data }: Props): ReactNode {
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

  return (
    <PikoCard>
      <XStack
        mb="$3"
        style={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text fontSize="$4" fontWeight="600" color="$gray10">
          {data.weekLabel}
        </Text>
        <Text fontSize="$4" fontWeight="600" color="$color">
          本周概览
        </Text>
      </XStack>
      <PikoWeekCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        markedDates={markedDates}
      />
    </PikoCard>
  );
}
