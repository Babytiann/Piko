import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';
import { EXPENSE_CATEGORY_COLORS } from '@/common/consts/theme';
import type { CategoryCardsData } from '@/common/typings/home';

interface Props {
  data: CategoryCardsData;
}

function getCategoryColor(category: string): string {
  return (
    EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] ??
    EXPENSE_CATEGORY_COLORS['其他']
  );
}

export default function HomeCategoryCards({ data }: Props): ReactNode {
  return (
    <PikoCard>
      <XStack
        mb="$3"
        style={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text fontSize="$4" fontWeight="600" color="$color">
          消费分类
        </Text>
        <Text fontSize="$3" color="$blue9">
          查看全部
        </Text>
      </XStack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {data.categories.map((item) => (
          <YStack
            key={item.category}
            style={{
              width: 72,
              padding: 12,
              borderRadius: 12,
              backgroundColor: getCategoryColor(item.category),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text fontSize="$5" fontWeight="600" color="#1a1a1a">
              ¥{item.amount.toFixed(0)}
            </Text>
            <Text fontSize="$2" color="rgba(0,0,0,0.7)" mt="$1">
              {item.category}
            </Text>
          </YStack>
        ))}
      </ScrollView>
    </PikoCard>
  );
}
