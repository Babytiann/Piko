import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { XStack, YStack, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import type { MessageItem } from '@/common/typings/chat';

const IMESSAGE_BLUE = '#007AFF';
const INPUT_RADIUS = 22;
const SEND_SIZE = 36;

interface ChatDetailMessageInputProps {
  placeholder: string;
  onSend: (text: string) => Promise<void>;
  bottomInset?: number;
  replyTo?: MessageItem | null;
  onCancelReply?: () => void;
}

export default function ChatDetailMessageInput({
  placeholder,
  onSend,
  bottomInset = 0,
  replyTo,
  onCancelReply,
}: ChatDetailMessageInputProps): ReactNode {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = text.trim();

  const handleSend = async (): Promise<void> => {
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await onSend(trimmed);
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      borderTopWidth={StyleSheet.hairlineWidth}
      borderColor="$gray5"
      bg="$background"
      pb={bottomInset}
    >
      {replyTo ? (
        <XStack
          px="$3"
          py="$2"
          bg="$gray3"
          gap="$2"
          borderBottomWidth={StyleSheet.hairlineWidth}
          borderColor="$gray5"
          style={{ alignItems: 'center' }}
        >
          <View
            width={3}
            bg={IMESSAGE_BLUE}
            style={{ alignSelf: 'stretch', borderRadius: 4 }}
          />
          <YStack flex={1} gap={2}>
            <Text
              fontSize="$1"
              fontWeight="600"
              color="$color"
              numberOfLines={1}
            >
              {replyTo.sender_name || '消息'}
            </Text>
            <Text fontSize="$1" color="$gray11" numberOfLines={1}>
              {replyTo.text || (replyTo.has_media ? '[媒体]' : '')}
            </Text>
          </YStack>
          <Text
            fontSize={18}
            color="$gray10"
            pressStyle={{ opacity: 0.6 }}
            onPress={onCancelReply}
            hitSlop={8}
          >
            ✕
          </Text>
        </XStack>
      ) : null}

      <XStack px="$3" py="$2.5" gap="$2.5" style={{ alignItems: 'flex-end' }}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="default"
        />
        <View
          width={SEND_SIZE}
          height={SEND_SIZE}
          bg={trimmed ? IMESSAGE_BLUE : '$gray4'}
          opacity={trimmed ? 1 : 0.5}
          pressStyle={trimmed ? { scale: 0.92 } : undefined}
          onPress={!sending && trimmed ? () => void handleSend() : undefined}
          animation="quick"
          style={{
            borderRadius: SEND_SIZE / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={trimmed ? 'white' : '#8E8E93'}
            />
          )}
        </View>
      </XStack>
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: INPUT_RADIUS,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    lineHeight: 20,
  },
});
