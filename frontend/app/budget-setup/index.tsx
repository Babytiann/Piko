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

import {
  PRIMARY,
  PRIMARY_FOREGROUND,
  MUTED,
  BORDER,
  DESTRUCTIVE,
} from '@/common/consts/theme';
import { setBudget } from '@/services/budget';
import { get, clear } from '@/common/lib/route-cache';
import { appEvents } from '@/common/lib/app-events';
import type { HomeLabels, HomeSlashNodes } from '@/common/typings/home';

interface HomeCachePayload {
  bodyLayout: string[];
  nodes: HomeSlashNodes | undefined;
  labels: HomeLabels | undefined;
}

export default function BudgetSetupScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cached = get<HomeCachePayload>('/');
  const bl = cached?.labels?.budget_setup;
  const cl = cached?.labels?.common;

  const num = value.trim() === '' ? NaN : Number(value.trim());
  const valid = Number.isFinite(num) && num >= 0;

  const handleSubmit = async (): Promise<void> => {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await setBudget(num);
      if (res.success) {
        // 清首页缓存，触发 Home 立即刷新
        clear('/');
        if (res.data) {
          appEvents.emit('budget-updated', {
            monthly_budget: res.data.monthly_budget,
            weekly_budget: res.data.weekly_budget,
          });
        }
        router.back();
        return;
      }
      setError(res.error ?? cl?.save_failed ?? '');
    } catch {
      setError(cl?.network_error ?? '');
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
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>

        <Text fontSize="$6" fontWeight="700" color="$color" mb="$2">
          {bl?.title ?? ''}
        </Text>
        <Text fontSize="$3" color="$gray10" mb="$4">
          {bl?.subtitle ?? ''}
        </Text>

        <YStack mb="$4">
          <Text fontSize="$2" color="$gray10" mb="$2">
            {bl?.input_label ?? ''}
          </Text>
          <TextInput
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            placeholder={bl?.placeholder ?? ''}
            placeholderTextColor={MUTED}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: error ? DESTRUCTIVE : BORDER,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 17,
              color: PRIMARY,
            }}
          />
          {error ? (
            <Text fontSize="$2" color="$destructive" mt="$2">
              {error}
            </Text>
          ) : null}
        </YStack>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || submitting}
          style={{
            backgroundColor: valid && !submitting ? PRIMARY : BORDER,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text
            fontSize="$4"
            fontWeight="600"
            color={valid && !submitting ? PRIMARY_FOREGROUND : MUTED}
          >
            {submitting ? (cl?.saving ?? '') : (cl?.save ?? '')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
