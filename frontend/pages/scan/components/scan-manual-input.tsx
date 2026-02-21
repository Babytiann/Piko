import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, XStack, YStack, Text, Input } from 'tamagui';

import type { ExpenseCategory, ExpenseRecord } from '../types';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../consts';

interface Props {
  onSave: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

export default function ScanManualInput({ onSave, onBack }: Props): ReactNode {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('餐饮');
  const [date, setDate] = useState(today);

  const handleSave = (): void => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    onSave({
      amount: parsed,
      merchant: merchant.trim() || '未知商家',
      category,
      date,
      source: 'manual',
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View flex={1} bg="$background" pt={insets.top}>
        {/* 头部 */}
        <XStack px="$4" py="$3" style={{ alignItems: 'center' }}>
          <View pressStyle={{ opacity: 0.7 }} onPress={onBack} px="$2" py="$1">
            <Ionicons name="arrow-back" size={24} color="#999" />
          </View>
          <Text
            flex={1}
            fontSize="$5"
            fontWeight="600"
            color="$color"
            style={{ textAlign: 'center' }}
          >
            手动记账
          </Text>
          <View width={40} />
        </XStack>

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
                placeholder="0.00"
                fontSize={24}
                fontWeight="600"
                color="$color"
                borderWidth={0}
                bg="transparent"
                px="$1"
                autoFocus
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
              placeholder="商家名称（选填）"
              bg="$gray3"
              px="$3"
              py="$2.5"
              fontSize={16}
              color="$color"
              borderWidth={0}
              style={{ borderRadius: 12 }}
            />
          </YStack>

          {/* 分类 */}
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
                    bg={isSelected ? '$blue9' : '$gray3'}
                    style={{ borderRadius: 10 }}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => setCategory(cat)}
                  >
                    <XStack gap="$1.5" style={{ alignItems: 'center' }}>
                      <Ionicons
                        name={CATEGORY_ICONS[cat] as never}
                        size={14}
                        color={isSelected ? 'white' : '#999'}
                      />
                      <Text
                        color={isSelected ? 'white' : '$color'}
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
            bg="$blue9"
            py="$3"
            style={{ borderRadius: 14, alignItems: 'center' }}
            pressStyle={{ opacity: 0.85 }}
            onPress={handleSave}
          >
            <Text color="white" fontWeight="700" fontSize="$4">
              确认记账
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
