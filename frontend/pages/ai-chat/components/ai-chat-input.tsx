import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';
import { XStack, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function AiChatInput({
  onSend,
  disabled = false,
  placeholder = '问我任何问题...',
}: Props): ReactNode {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend]);

  return (
    <XStack
      px="$3"
      py="$2"
      gap="$2"
      bg="$background"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderTopColor="$gray5"
      style={{ alignItems: 'flex-end' }}
    >
      <View
        flex={1}
        bg="$gray3"
        px="$3"
        py={Platform.OS === 'ios' ? '$2' : '$1'}
        style={{ borderRadius: 20, minHeight: 40, justifyContent: 'center' }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#9BA1A6"
          multiline
          maxLength={2000}
          style={styles.input}
          editable={!disabled}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      <View
        width={40}
        height={40}
        bg={canSend ? '$blue9' : '$gray5'}
        opacity={canSend ? 1 : 0.5}
        pressStyle={canSend ? { scale: 0.92 } : undefined}
        onPress={canSend ? handleSend : undefined}
        animation="quick"
        style={{
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="arrow-up"
          size={20}
          color={canSend ? '#FFFFFF' : '#9BA1A6'}
        />
      </View>
    </XStack>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    lineHeight: 22,
    color: '#11181C',
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
