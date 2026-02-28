import type { ReactNode } from 'react';
import { useState, useEffect, useCallback, useContext } from 'react';
import { Pressable, Alert, Image } from 'react-native';
import { YStack, XStack, Text, View, ScrollView } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import PageLoading from '@/common/components/page-loading';
import {
  CATEGORY_ICON_CONFIG,
  MUTED,
  PRIMARY,
  DESTRUCTIVE,
} from '@/common/consts/theme';
import { RecognitionContext } from '@/contexts/recognition-context';
import { fetchExpenseDetail, deleteExpenseApi } from '@/services/expense';
import type { ExpenseDetail } from '@/services/expense';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  if (h === '00' && min === '00') return `${y}年${m}月${day}日`;
  return `${y}年${m}月${day}日 ${h}:${min}`;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode {
  return (
    <XStack
      py="$3"
      style={{ alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Text fontSize={14} color="$muted">
        {label}
      </Text>
      <Text fontSize={14} fontWeight="600" color="$color">
        {value}
      </Text>
    </XStack>
  );
}

export default function ExpenseDetailScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const recognition = useContext(RecognitionContext);
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchExpenseDetail(id);
        if (!cancelled && res.data) {
          setExpense(res.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert('删除消费', '确认删除这笔消费记录？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteExpenseApi(id);
          if (recognition.expenseId === id) {
            recognition.dismiss();
          }
          router.back();
        },
      },
    ]);
  }, [id, router, recognition]);

  if (loading) return <PageLoading />;

  if (!expense) {
    return (
      <YStack flex={1} bg="$background" pt={top + 16} px="$4">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </Pressable>
        <YStack
          flex={1}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Text fontSize={15} color="$muted">
            未找到消费记录
          </Text>
        </YStack>
      </YStack>
    );
  }

  const config =
    CATEGORY_ICON_CONFIG[expense.category] ?? CATEGORY_ICON_CONFIG['其他'];
  const sourceLabel: Record<string, string> = {
    camera: '拍照识别',
    album: '相册识别',
    manual: '手动录入',
    telegram: 'Telegram 导入',
  };

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        contentContainerStyle={{ paddingTop: top, paddingBottom: 40 }}
      >
        <XStack
          px="$4"
          py="$3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color={DESTRUCTIVE} />
          </Pressable>
        </XStack>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <YStack px="$4" py="$4" style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                borderCurve: 'continuous',
                backgroundColor: config.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={config.icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={config.iconColor}
              />
            </View>
            <Text fontSize={13} color="$muted" mb={4}>
              {expense.merchant ?? expense.category}
            </Text>
            <Text
              fontSize={36}
              fontWeight="800"
              color="$color"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              ¥{expense.amount}
            </Text>
          </YStack>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <YStack
            mx="$4"
            px="$4"
            py="$2"
            bg="$card"
            style={{ borderRadius: 16, borderCurve: 'continuous' }}
          >
            <InfoRow label="分类" value={expense.category} />
            {expense.merchant ? (
              <InfoRow label="商户" value={expense.merchant} />
            ) : null}
            <InfoRow label="日期" value={formatDate(expense.date)} />
            <InfoRow
              label="来源"
              value={sourceLabel[expense.source] ?? expense.source}
            />
            {expense.confidence != null ? (
              <InfoRow
                label="置信度"
                value={`${Math.round(expense.confidence * 100)}%`}
              />
            ) : null}
            <InfoRow label="记录时间" value={formatDate(expense.createdAt)} />
          </YStack>
        </Animated.View>

        {expense.items && expense.items.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <YStack
              mx="$4"
              mt="$3"
              px="$4"
              py="$3"
              bg="$card"
              style={{ borderRadius: 16, borderCurve: 'continuous' }}
            >
              <Text fontSize={14} fontWeight="600" color="$color" mb="$2">
                消费明细
              </Text>
              {expense.items.map((item, i) => (
                <Text key={i} fontSize={14} color="$muted" mt={4}>
                  · {item}
                </Text>
              ))}
            </YStack>
          </Animated.View>
        ) : null}

        {expense.imageUrl ? (
          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <YStack
              mx="$4"
              mt="$3"
              px="$4"
              py="$3"
              bg="$card"
              style={{ borderRadius: 16, borderCurve: 'continuous' }}
            >
              <Text fontSize={14} fontWeight="600" color="$color" mb="$2">
                原始图片
              </Text>
              <Image
                source={{ uri: expense.imageUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 12,
                  backgroundColor: '#F5F5F5',
                }}
                resizeMode="contain"
              />
            </YStack>
          </Animated.View>
        ) : null}
      </ScrollView>
    </YStack>
  );
}
