import type { ReactNode } from 'react';
import { useState } from 'react';
import { TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { XStack, YStack, Text, View } from 'tamagui';

import type { MessageItem } from '@/common/typings/chat';

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
      borderTopWidth={1}
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
          borderBottomWidth={1}
          borderColor="$gray5"
          style={{ alignItems: 'center' }}
        >
          <View
            width={3}
            bg="$primary"
            style={{ alignSelf: 'stretch', borderRadius: 4 }}
          />
          <YStack flex={1} gap={2}>
            <Text
              fontSize="$1"
              fontWeight="600"
              color="$primaryForeground"
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

      <XStack px="$3" py="$2" gap="$2" style={{ alignItems: 'flex-end' }}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="default"
        />
        <View
          width={36}
          height={36}
          bg={trimmed ? '$primary' : '$gray4'}
          opacity={trimmed ? 1 : 0.5}
          pressStyle={trimmed ? { scale: 0.92 } : undefined}
          onPress={!sending && trimmed ? () => void handleSend() : undefined}
          animation="quick"
          style={{
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text
              color={trimmed ? 'white' : '$gray10'}
              fontSize={18}
              fontWeight="600"
            >
              ↑
            </Text>
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
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
  },
});
