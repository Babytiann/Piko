import { useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';
import { XStack, View, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import useKeyboardBottomInset from '../hooks/useKeyboardBottomInset';

const IMESSAGE_BLUE = '#007AFF';
const INPUT_RADIUS = 22;
const SEND_SIZE = 40;

interface Props {
  onSend: (text: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export default function AiChatInput({
  onSend,
  isStreaming = false,
  onStop,
  placeholder = '问我任何问题...',
}: Props): ReactNode {
  const [text, setText] = useState('');
  const theme = useTheme();
  const canSend = text.trim().length > 0 && !isStreaming;
  const bottomInset = useKeyboardBottomInset();

  function handleSend(): void {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSend(trimmed);
    setText('');
  }

  function handleStop(): void {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStop?.();
  }

  const textColor = theme.color.val;
  const placeholderColor = theme.gray9.val;

  return (
    <XStack
      px="$3"
      py="$2.5"
      gap="$2.5"
      bg="$card"
      pb={bottomInset}
      borderTopWidth={StyleSheet.hairlineWidth}
      borderTopColor="$gray5"
      style={{ alignItems: 'flex-end' }}
    >
      <View
        flex={1}
        bg="$gray3"
        px="$3"
        style={{
          borderRadius: INPUT_RADIUS,
          minHeight: 40,
          justifyContent: 'center',
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          multiline
          maxLength={2000}
          style={[styles.input, { color: textColor }]}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      {isStreaming ? (
        <View
          width={SEND_SIZE}
          height={SEND_SIZE}
          bg="$red9"
          pressStyle={{ scale: 0.92 }}
          onPress={handleStop}
          animation="quick"
          style={{
            borderRadius: SEND_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="stop" size={18} color="#FFFFFF" />
        </View>
      ) : (
        <View
          width={SEND_SIZE}
          height={SEND_SIZE}
          bg={canSend ? IMESSAGE_BLUE : '$gray5'}
          opacity={canSend ? 1 : 0.5}
          pressStyle={canSend ? { scale: 0.92 } : undefined}
          onPress={canSend ? handleSend : undefined}
          animation="quick"
          style={{
            borderRadius: SEND_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? '#FFFFFF' : theme.gray9.val}
          />
        </View>
      )}
    </XStack>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
