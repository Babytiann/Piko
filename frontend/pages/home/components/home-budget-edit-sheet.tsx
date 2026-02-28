import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { setBudget } from '@/services/budget';
import { MUTED, PRIMARY } from '@/common/consts/theme';
import type { HomeLabels } from '@/common/typings/home';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  currentBudget: number;
  labels: HomeLabels;
  onClose: () => void;
  onSaved: () => void;
}

const PRESETS = [2000, 4000, 6000, 8000];

export default function HomeBudgetEditSheet({
  visible,
  currentBudget,
  labels,
  onClose,
  onSaved,
}: Props): ReactNode {
  const bl = labels.budget_card;
  const cl = labels.common;
  const cs = cl.currency_symbol;

  const [value, setValue] = useState(String(currentBudget));
  const [saving, setSaving] = useState(false);
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const handlePreset = (amount: number): void => {
    setValue(String(amount));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async (): Promise<void> => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      const res = await setBudget(num);
      if (res.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        onSaved();
      }
    } catch (err) {
      console.error('[BudgetEdit] save error:', err);
    } finally {
      setSaving(false);
    }
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable onPress={() => {}}>
            <Animated.View style={sheetStyle}>
              <YStack
                bg="$card"
                style={{
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderCurve: 'continuous',
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <XStack
                  mb="$4"
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text fontSize={18} fontWeight="700" color="$color">
                    {bl.edit_sheet_title}
                  </Text>
                  <Pressable onPress={onClose} hitSlop={8}>
                    <Ionicons name="close" size={22} color={MUTED} />
                  </Pressable>
                </XStack>

                <YStack mb="$4">
                  <Text fontSize={12} color="$muted" mb="$2">
                    {bl.edit_amount_label}
                  </Text>
                  <XStack
                    style={{
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: '#E5E5EA',
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text fontSize={18} fontWeight="600" color="$color" mr="$1">
                      {cs}
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={setValue}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        fontSize: 24,
                        fontWeight: '700',
                        color: '#11181C',
                        fontVariant: ['tabular-nums'],
                      }}
                      autoFocus
                      selectTextOnFocus
                    />
                  </XStack>
                </YStack>

                <XStack gap="$2" mb="$5">
                  {PRESETS.map((amount) => (
                    <Pressable
                      key={amount}
                      onPress={() => handlePreset(amount)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderCurve: 'continuous',
                        backgroundColor:
                          value === String(amount) ? '#11181C' : '#F5F5F5',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="600"
                        color={value === String(amount) ? 'white' : '$color'}
                      >
                        {cs}
                        {amount.toLocaleString()}
                      </Text>
                    </Pressable>
                  ))}
                </XStack>

                <Pressable
                  onPress={() => void handleSave()}
                  disabled={saving}
                  style={{
                    backgroundColor: PRIMARY,
                    borderRadius: 14,
                    borderCurve: 'continuous',
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text fontSize={16} fontWeight="700" color="white">
                    {saving ? cl.saving : cl.save}
                  </Text>
                </Pressable>
              </YStack>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
