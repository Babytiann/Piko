import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { MUTED, CATEGORY_ICON_CONFIG } from '@/common/consts/theme';
import type { CategoryCardItem } from '@/common/typings/home';
import { fetchExpenseList } from '@/services/ai';

const SCREEN_H = Dimensions.get('window').height;

interface ExpenseRow {
  id: string;
  amount: number;
  merchant: string | null;
  category: string;
  date: string;
  source: string;
}

interface Props {
  visible: boolean;
  category: CategoryCardItem;
  onClose: () => void;
}

export default function HomeCategoryDetailSheet({
  visible,
  category,
  onClose,
}: Props): ReactNode {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const now = new Date();
    const weekStart = new Date(now);
    const dow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);

    void fetchExpenseList({
      start_date: weekStart.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      page_size: 100,
    })
      .then((res) => {
        setExpenses(
          res.expenses.filter((e) => e.category === category.category),
        );
      })
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [visible, category.category]);

  const config =
    CATEGORY_ICON_CONFIG[category.category] ?? CATEGORY_ICON_CONFIG['其他'];

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View style={sheetStyle}>
            <YStack
              bg="$card"
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderCurve: 'continuous',
                paddingTop: 20,
                paddingBottom: 40,
                minHeight: 300,
                maxHeight: '70%',
              }}
            >
              <XStack
                px="$5"
                mb="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 10 }}>
                  <Ionicons
                    name={config.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={config.iconColor}
                  />
                  <Text fontSize={18} fontWeight="700" color="$color">
                    {category.category}
                  </Text>
                </XStack>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={MUTED} />
                </Pressable>
              </XStack>

              <XStack px="$5" mb="$4" gap="$4">
                <YStack>
                  <Text fontSize={11} color="$muted">
                    本周合计
                  </Text>
                  <Text
                    fontSize={20}
                    fontWeight="700"
                    color="$color"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    ¥{category.amount.toLocaleString()}
                  </Text>
                </YStack>
                <YStack>
                  <Text fontSize={11} color="$muted">
                    占比
                  </Text>
                  <Text fontSize={20} fontWeight="700" color="$color">
                    {category.percentage}%
                  </Text>
                </YStack>
              </XStack>

              {loading ? (
                <YStack py="$6" style={{ alignItems: 'center' }}>
                  <ActivityIndicator />
                </YStack>
              ) : (
                <FlatList
                  data={expenses}
                  keyExtractor={(item) => item.id}
                  style={{ flexGrow: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
                  renderItem={({ item }) => (
                    <XStack
                      py="$3"
                      style={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      borderBottomWidth={0.5}
                      borderBottomColor="$gray4"
                    >
                      <YStack>
                        <Text fontSize={14} fontWeight="600" color="$color">
                          {item.merchant ?? category.category}
                        </Text>
                        <Text fontSize={11} color="$muted" mt={2}>
                          {item.date.slice(5, 10)}
                        </Text>
                      </YStack>
                      <Text
                        fontSize={14}
                        fontWeight="600"
                        color="$color"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        -¥{item.amount}
                      </Text>
                    </XStack>
                  )}
                  ListEmptyComponent={
                    <YStack
                      flex={1}
                      style={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text fontSize={13} color="$muted">
                        暂无消费记录
                      </Text>
                    </YStack>
                  }
                />
              )}
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
