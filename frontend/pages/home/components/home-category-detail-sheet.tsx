import type { ReactNode } from 'react';
import { useMemo, useEffect } from 'react';
import { Modal, Pressable, FlatList, Dimensions } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { MUTED, CATEGORY_ICON_CONFIG } from '@/common/consts/theme';
import type { CategoryCardItem, ExpenseListItem } from '@/common/typings/home';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  category: CategoryCardItem;
  allExpenses: ExpenseListItem[];
  onClose: () => void;
}

export default function HomeCategoryDetailSheet({
  visible,
  category,
  allExpenses,
  onClose,
}: Props): ReactNode {
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const expenses = useMemo(
    () => allExpenses.filter((e) => e.category === category.category),
    [allExpenses, category.category],
  );

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
                height: SCREEN_H * 0.5,
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
                        {item.time ? ` ${item.time}` : ''}
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
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
