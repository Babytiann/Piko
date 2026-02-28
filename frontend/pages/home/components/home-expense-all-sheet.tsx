import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Modal, Pressable, FlatList, Dimensions } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { MUTED, CATEGORY_ICON_CONFIG } from '@/common/consts/theme';
import type { ExpenseListItem, HomeLabels } from '@/common/typings/home';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  expenses: ExpenseListItem[];
  totalAmount: number;
  title?: string;
  labels: HomeLabels;
  onClose: () => void;
}

export default function HomeExpenseAllSheet({
  visible,
  expenses,
  totalAmount,
  title,
  labels,
  onClose,
}: Props): ReactNode {
  const router = useRouter();
  const translateY = useSharedValue(SCREEN_H);
  const el = labels.expense_list;
  const cs = labels.common.currency_symbol;
  const displayTitle = title ?? el.today_label;

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const countLine = el.count_format.replace('{count}', String(expenses.length));

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
                height: SCREEN_H * 0.7,
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
                <YStack>
                  <Text fontSize={18} fontWeight="700" color="$color">
                    {displayTitle}
                  </Text>
                  <Text fontSize={12} color="$muted" mt={2}>
                    {countLine} {cs}
                    {Math.round(totalAmount * 100) / 100}
                  </Text>
                </YStack>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={MUTED} />
                </Pressable>
              </XStack>

              <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => {
                  const config =
                    CATEGORY_ICON_CONFIG[item.category] ??
                    CATEGORY_ICON_CONFIG['其他'];
                  return (
                    <Pressable
                      onPress={() => {
                        onClose();
                        setTimeout(() => {
                          router.push({
                            pathname: '/expense-detail',
                            params: { id: item.id },
                          });
                        }, 300);
                      }}
                    >
                      <XStack
                        py="$3"
                        style={{ alignItems: 'center', gap: 12 }}
                        borderBottomWidth={0.5}
                        borderBottomColor="$gray4"
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            borderCurve: 'continuous',
                            backgroundColor: config.bgColor,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Ionicons
                            name={config.icon as keyof typeof Ionicons.glyphMap}
                            size={18}
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
                          <XStack
                            mt={2}
                            gap="$1"
                            style={{ alignItems: 'center' }}
                          >
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
                            -{cs}
                            {item.amount}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={MUTED}
                          />
                        </XStack>
                      </XStack>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <YStack
                    flex={1}
                    py="$6"
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text fontSize={13} color="$muted">
                      {el.no_records}
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
