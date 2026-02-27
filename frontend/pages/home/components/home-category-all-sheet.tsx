import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Modal, Pressable, FlatList, Dimensions } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { MUTED, CATEGORY_ICON_CONFIG } from '@/common/consts/theme';
import type { CategoryCardItem } from '@/common/typings/home';

const SCREEN_H = Dimensions.get('window').height;
type SortMode = 'amount' | 'name';

interface Props {
  visible: boolean;
  categories: CategoryCardItem[];
  onClose: () => void;
  onSelectCategory: (item: CategoryCardItem) => void;
}

export default function HomeCategoryAllSheet({
  visible,
  categories,
  onClose,
  onSelectCategory,
}: Props): ReactNode {
  const [sortMode, setSortMode] = useState<SortMode>('amount');
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const sorted = [...categories].sort((a, b) => {
    if (sortMode === 'amount') return b.amount - a.amount;
    return a.category.localeCompare(b.category);
  });

  const totalAmount = categories.reduce((s, c) => s + c.amount, 0);

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
                maxHeight: '80%',
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
                <Text fontSize={18} fontWeight="700" color="$color">
                  全部分类
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={MUTED} />
                </Pressable>
              </XStack>

              <XStack px="$5" mb="$3" gap="$2">
                <Pressable
                  onPress={() => setSortMode('amount')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor:
                      sortMode === 'amount' ? '#11181C' : '#F5F5F5',
                  }}
                >
                  <Text
                    fontSize={12}
                    fontWeight="600"
                    color={sortMode === 'amount' ? 'white' : '$muted'}
                  >
                    按金额
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSortMode('name')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor:
                      sortMode === 'name' ? '#11181C' : '#F5F5F5',
                  }}
                >
                  <Text
                    fontSize={12}
                    fontWeight="600"
                    color={sortMode === 'name' ? 'white' : '$muted'}
                  >
                    按名称
                  </Text>
                </Pressable>
              </XStack>

              <FlatList
                data={sorted}
                keyExtractor={(item) => item.category}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => {
                  const config =
                    CATEGORY_ICON_CONFIG[item.category] ??
                    CATEGORY_ICON_CONFIG['其他'];
                  const pct =
                    totalAmount > 0
                      ? Math.round((item.amount / totalAmount) * 100)
                      : 0;

                  return (
                    <Pressable
                      onPress={() => {
                        onClose();
                        setTimeout(() => onSelectCategory(item), 300);
                      }}
                    >
                      <XStack
                        py="$3"
                        style={{ alignItems: 'center' }}
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
                            marginRight: 12,
                          }}
                        >
                          <Ionicons
                            name={config.icon as keyof typeof Ionicons.glyphMap}
                            size={18}
                            color={config.iconColor}
                          />
                        </View>
                        <YStack flex={1}>
                          <Text fontSize={14} fontWeight="600" color="$color">
                            {item.category}
                          </Text>
                          <View
                            style={{
                              height: 3,
                              backgroundColor: '#F5F5F5',
                              borderRadius: 2,
                              overflow: 'hidden',
                              marginTop: 6,
                            }}
                          >
                            <View
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                backgroundColor: config.iconColor,
                                borderRadius: 2,
                              }}
                            />
                          </View>
                        </YStack>
                        <YStack
                          style={{ alignItems: 'flex-end', marginLeft: 12 }}
                        >
                          <Text
                            fontSize={14}
                            fontWeight="700"
                            color="$color"
                            style={{ fontVariant: ['tabular-nums'] }}
                          >
                            ¥{item.amount.toLocaleString()}
                          </Text>
                          <Text fontSize={11} color="$muted">
                            {pct}%
                          </Text>
                        </YStack>
                      </XStack>
                    </Pressable>
                  );
                }}
              />
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
