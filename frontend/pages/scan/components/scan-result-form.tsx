import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, XStack, YStack, Text, Input } from 'tamagui';

import { DESTRUCTIVE, MUTED, WARNING } from '@/common/consts/theme';
import type { RecognizeResult, ExpenseCategory, ExpenseRecord } from '../types';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../consts';

interface Props {
  result: RecognizeResult;
  /** 识别错误（如有，展示重试提示） */
  error: string | null;
  /** 消费来源（camera / album） */
  source: 'camera' | 'album';
  onSave: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onRetake: () => void;
}

export default function ScanResultForm({
  result,
  error,
  source,
  onSave,
  onRetake,
}: Props): ReactNode {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(String(result.amount));
  const [merchant, setMerchant] = useState(result.merchant);
  const [category, setCategory] = useState<ExpenseCategory>(result.category);
  const [date, setDate] = useState(result.date);

  const handleSave = (): void => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    onSave({
      amount: parsed,
      merchant: merchant.trim() || '未知商家',
      category,
      date,
      items: result.items,
      source,
    });
  };

  if (error) {
    return (
      <View flex={1} bg="$background" pt={insets.top} style={center}>
        <YStack gap="$4" px="$6" style={{ alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={48} color={DESTRUCTIVE} />
          <Text color="$color" fontSize="$5" fontWeight="600">
            识别失败
          </Text>
          <Text color="$gray11" fontSize="$3" style={{ textAlign: 'center' }}>
            {error}
          </Text>
          <View
            bg="$primary"
            px="$5"
            py="$2.5"
            style={{ borderRadius: 12 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={onRetake}
          >
            <Text color="$primaryForeground" fontWeight="600">
              重新拍照
            </Text>
          </View>
        </YStack>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View flex={1} bg="$background" pt={insets.top}>
        {/* 头部 */}
        <XStack px="$4" py="$3" style={{ alignItems: 'center' }}>
          <View
            pressStyle={{ opacity: 0.7 }}
            onPress={onRetake}
            px="$2"
            py="$1"
          >
            <Ionicons name="arrow-back" size={24} color={MUTED} />
          </View>
          <Text
            flex={1}
            fontSize="$5"
            fontWeight="600"
            color="$color"
            style={{ textAlign: 'center' }}
          >
            确认消费
          </Text>
          <View width={40} />
        </XStack>

        {/* 置信度提示 */}
        {result.confidence < 0.7 ? (
          <XStack
            mx="$4"
            mb="$2"
            px="$3"
            py="$2"
            bg="$yellow3"
            gap="$2"
            style={{ borderRadius: 8, alignItems: 'center' }}
          >
            <Ionicons name="warning-outline" size={16} color={WARNING} />
            <Text color="$yellow11" fontSize="$2">
              识别置信度较低，请确认信息是否正确
            </Text>
          </XStack>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 金额 */}
          <YStack gap="$2" mb="$4" mt="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="500">
              金额
            </Text>
            <XStack
              bg="$gray3"
              px="$3"
              py="$2.5"
              gap="$1"
              style={{ borderRadius: 12, alignItems: 'center' }}
            >
              <Text color="$color" fontSize="$6" fontWeight="600">
                ¥
              </Text>
              <Input
                flex={1}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                fontSize={24}
                fontWeight="600"
                color="$color"
                borderWidth={0}
                bg="transparent"
                px="$1"
              />
            </XStack>
          </YStack>

          {/* 商家 */}
          <YStack gap="$2" mb="$4">
            <Text color="$gray11" fontSize="$2" fontWeight="500">
              商家
            </Text>
            <Input
              value={merchant}
              onChangeText={setMerchant}
              placeholder="商家名称"
              bg="$gray3"
              px="$3"
              py="$2.5"
              fontSize={16}
              color="$color"
              borderWidth={0}
              style={{ borderRadius: 12 }}
            />
          </YStack>

          {/* 分类选择 */}
          <YStack gap="$2" mb="$4">
            <Text color="$gray11" fontSize="$2" fontWeight="500">
              分类
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = cat === category;
                return (
                  <View
                    key={cat}
                    px="$3"
                    py="$2"
                    bg={isSelected ? '$primary' : '$gray3'}
                    style={{ borderRadius: 10 }}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => setCategory(cat)}
                  >
                    <XStack gap="$1.5" style={{ alignItems: 'center' }}>
                      <Ionicons
                        name={CATEGORY_ICONS[cat] as never}
                        size={14}
                        color={isSelected ? '#FFFFFF' : MUTED}
                      />
                      <Text
                        color={isSelected ? '$primaryForeground' : '$color'}
                        fontSize="$2"
                        fontWeight={isSelected ? '600' : '400'}
                      >
                        {cat}
                      </Text>
                    </XStack>
                  </View>
                );
              })}
            </XStack>
          </YStack>

          {/* 日期 */}
          <YStack gap="$2" mb="$4">
            <Text color="$gray11" fontSize="$2" fontWeight="500">
              日期
            </Text>
            <Input
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              bg="$gray3"
              px="$3"
              py="$2.5"
              fontSize={16}
              color="$color"
              borderWidth={0}
              style={{ borderRadius: 12 }}
            />
          </YStack>

          {/* 明细项（只读） */}
          {result.items && result.items.length > 0 ? (
            <YStack gap="$2" mb="$4">
              <Text color="$gray11" fontSize="$2" fontWeight="500">
                明细
              </Text>
              <YStack
                bg="$gray3"
                px="$3"
                py="$2.5"
                gap="$1"
                style={{ borderRadius: 12 }}
              >
                {result.items.map((item, i) => (
                  <Text key={i} color="$gray11" fontSize="$2">
                    · {item}
                  </Text>
                ))}
              </YStack>
            </YStack>
          ) : null}
        </ScrollView>

        {/* 底部保存按钮 */}
        <View
          position="absolute"
          px="$4"
          pt="$3"
          bg="$background"
          style={{
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View
            bg="$primary"
            py="$3"
            style={{ borderRadius: 14, alignItems: 'center' }}
            pressStyle={{ opacity: 0.85 }}
            onPress={handleSave}
          >
            <Text color="$primaryForeground" fontWeight="700" fontSize="$4">
              确认记账
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const center = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
