import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { setBudget } from '@/services/budget';

export default function BudgetSetupScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = value.trim() === '' ? NaN : Number(value.trim());
  const valid = Number.isFinite(num) && num >= 0;

  const handleSubmit = async (): Promise<void> => {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await setBudget(num);
      if (res.success) {
        router.back();
        return;
      }
      setError(res.error ?? '设置失败');
    } catch {
      setError('网络异常');
    } finally {
      setSubmitting(false);
    }
  };

  const padding = {
    paddingTop: insets.top + 16,
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: 24,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[padding, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-start', marginBottom: 24 }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>

        <Text fontSize="$6" fontWeight="700" color="$color" mb="$2">
          设置本周预算
        </Text>
        <Text fontSize="$3" color="$gray10" mb="$4">
          设置后可在首页查看预算使用进度
        </Text>

        <YStack mb="$4">
          <Text fontSize="$2" color="$gray10" mb="$2">
            本周预算（元）
          </Text>
          <TextInput
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            placeholder="例如 2000"
            placeholderTextColor="#9BA1A6"
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: error ? '#FF3B30' : '#E5E5EA',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 17,
              color: '#11181C',
            }}
          />
          {error ? (
            <Text fontSize="$2" color="#FF3B30" mt="$2">
              {error}
            </Text>
          ) : null}
        </YStack>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || submitting}
          style={{
            backgroundColor: valid && !submitting ? '#0a7ea4' : '#E5E5EA',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text
            fontSize="$4"
            fontWeight="600"
            color={valid && !submitting ? '#FFFFFF' : '#9BA1A6'}
          >
            {submitting ? '保存中…' : '保存'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
