import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack, YStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { PikoCard } from '@/common/components/piko-card';
import { CATEGORY_ICON_CONFIG } from '@/common/consts/theme';
import type {
  CategoryCardsData,
  CategoryCardItem,
} from '@/common/typings/home';
import HomeCategoryDetailSheet from './home-category-detail-sheet';
import HomeCategoryAllSheet from './home-category-all-sheet';

interface Props {
  data: CategoryCardsData;
}

function CategoryIcon({
  category,
  size = 32,
}: {
  category: string;
  size?: number;
}): ReactNode {
  const config = CATEGORY_ICON_CONFIG[category] ?? CATEGORY_ICON_CONFIG['其他'];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        borderCurve: 'continuous',
        backgroundColor: config.bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={config.icon as keyof typeof Ionicons.glyphMap}
        size={size * 0.5}
        color={config.iconColor}
      />
    </View>
  );
}

function ProgressBar({
  percentage,
  category,
}: {
  percentage: number;
  category: string;
}): ReactNode {
  const config = CATEGORY_ICON_CONFIG[category] ?? CATEGORY_ICON_CONFIG['其他'];
  return (
    <View
      style={{
        height: 3,
        backgroundColor: '#F5F5F5',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      <Animated.View
        entering={FadeInRight.delay(300).duration(500)}
        style={{
          height: '100%',
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: config.iconColor,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

export default function HomeCategoryCards({ data }: Props): ReactNode {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryCardItem | null>(null);
  const [showAllSheet, setShowAllSheet] = useState(false);

  const displayCategories = data.categories.slice(0, 6);

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()}>
      <PikoCard>
        <XStack
          mb="$3"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text fontSize={16} fontWeight="700" color="$color">
            消费分类
          </Text>
          <Pressable onPress={() => setShowAllSheet(true)} hitSlop={8}>
            <Text fontSize={13} color="$muted">
              查看全部
            </Text>
          </Pressable>
        </XStack>

        <XStack style={{ flexWrap: 'wrap', gap: 10 }}>
          {displayCategories.map((item, index) => (
            <Animated.View
              key={item.category}
              entering={FadeInDown.delay(index * 50 + 350).springify()}
              style={{ width: '31%' }}
            >
              <Pressable
                onPress={() => setSelectedCategory(item)}
                style={({ pressed }) => ({
                  padding: 12,
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#F0F0F0',
                  backgroundColor: pressed ? '#FAFAFA' : 'white',
                })}
              >
                <CategoryIcon category={item.category} />
                <Text fontSize={12} color="$muted" mt="$2">
                  {item.category}
                </Text>
                <Text
                  fontSize={14}
                  fontWeight="700"
                  color="$color"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ¥{item.amount.toLocaleString()}
                </Text>
                <ProgressBar
                  percentage={item.percentage}
                  category={item.category}
                />
              </Pressable>
            </Animated.View>
          ))}
        </XStack>
      </PikoCard>

      {selectedCategory ? (
        <HomeCategoryDetailSheet
          visible
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      ) : null}

      <HomeCategoryAllSheet
        visible={showAllSheet}
        categories={data.categories}
        onClose={() => setShowAllSheet(false)}
        onSelectCategory={setSelectedCategory}
      />
    </Animated.View>
  );
}

export { CategoryIcon };
