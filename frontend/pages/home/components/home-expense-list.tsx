import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { CATEGORY_ICON_CONFIG, MUTED } from '@/common/consts/theme';
import type { ExpenseListData, ExpenseListItem } from '@/common/typings/home';

import HomeExpenseAllSheet from './home-expense-all-sheet';

const MAX_VISIBLE = 3;

interface Props {
  data: ExpenseListData;
  selectedDate?: string;
}

function ExpenseRow({
  item,
  index,
}: {
  item: ExpenseListItem;
  index: number;
}): ReactNode {
  const router = useRouter();
  const config =
    CATEGORY_ICON_CONFIG[item.category] ?? CATEGORY_ICON_CONFIG['其他'];

  return (
    <Animated.View entering={FadeInRight.delay(index * 50 + 200).springify()}>
      <Pressable
        onPress={() =>
          router.push({ pathname: '/expense-detail', params: { id: item.id } })
        }
      >
        <XStack py="$3" px="$1" style={{ alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: config.bgColor,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ionicons
              name={config.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={config.iconColor}
            />
          </View>

          <YStack flex={1} style={{ minWidth: 0 }}>
            <Text
              fontSize={14}
              fontWeight="600"
              color="$color"
              numberOfLines={1}
            >
              {item.merchant ?? item.category}
            </Text>
            <XStack mt={2} gap="$1" style={{ alignItems: 'center' }}>
              <Text fontSize={11} color="$muted">
                {item.category}
              </Text>
              {item.time ? (
                <>
                  <Text fontSize={11} color="$gray6">
                    ·
                  </Text>
                  <Text fontSize={11} color="$muted">
                    {item.time}
                  </Text>
                </>
              ) : null}
            </XStack>
          </YStack>

          <XStack style={{ alignItems: 'center', gap: 6 }}>
            <Text
              fontSize={14}
              fontWeight="700"
              color="$color"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              -¥{item.amount}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={MUTED} />
          </XStack>
        </XStack>
      </Pressable>
    </Animated.View>
  );
}

function getDateLabel(dateStr: string, todayDate: string): string {
  if (dateStr === todayDate) return '今日消费';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日消费`;
}

export default function HomeExpenseList({
  data,
  selectedDate,
}: Props): ReactNode {
  const [showAll, setShowAll] = useState(false);

  const effectiveDate = selectedDate ?? data.today_date;

  const expenses = data.expenses ?? [];
  const filtered = useMemo(() => {
    return expenses.filter((e) => e.date === effectiveDate);
  }, [expenses, effectiveDate]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  const visibleExpenses = filtered.slice(0, MAX_VISIBLE);
  const hasMore = filtered.length > MAX_VISIBLE;
  const title = getDateLabel(effectiveDate, data.today_date);

  return (
    <Animated.View entering={FadeInDown.delay(400).springify()}>
      <PikoCard>
        <XStack
          mb="$1"
          style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <YStack>
            <Text fontSize={16} fontWeight="700" color="$color">
              {title}
            </Text>
            <Text fontSize={11} color="$muted" mt={2}>
              共 {filtered.length} 笔，合计 ¥
              {Math.round(totalAmount * 100) / 100}
            </Text>
          </YStack>
          {filtered.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setShowAll(true)}>
              <Text fontSize={13} color="$muted">
                查看全部
              </Text>
            </Pressable>
          )}
        </XStack>

        {visibleExpenses.length > 0 ? (
          <YStack>
            {visibleExpenses.map((item, index) => (
              <ExpenseRow key={item.id} item={item} index={index} />
            ))}
            {hasMore && (
              <Pressable
                onPress={() => setShowAll(true)}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <XStack style={{ alignItems: 'center', gap: 4 }}>
                  <Text fontSize={13} color={MUTED} fontWeight="500">
                    查看全部 {filtered.length} 笔
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={MUTED} />
                </XStack>
              </Pressable>
            )}
          </YStack>
        ) : (
          <YStack py="$4" style={{ alignItems: 'center' }}>
            <Text fontSize={13} color="$muted">
              当日暂无消费记录
            </Text>
          </YStack>
        )}
      </PikoCard>

      <HomeExpenseAllSheet
        visible={showAll}
        expenses={filtered}
        totalAmount={totalAmount}
        title={title}
        onClose={() => setShowAll(false)}
      />
    </Animated.View>
  );
}
