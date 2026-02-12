import { useState } from 'react';
import { TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { XStack, YStack, Text, View } from 'tamagui';
import type { MessageItem } from '@/types/chat';

interface MessageInputProps {
  placeholder: string;
  onSend: (text: string) => Promise<void>;
  bottomInset?: number;
  /** The message being replied to, shown as a preview bar above the input. */
  replyTo?: MessageItem | null;
  /** Called when the user dismisses the reply preview. */
  onCancelReply?: () => void;
}

export default function MessageInput({
  placeholder,
  onSend,
  bottomInset = 0,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = text.trim();

  const handleSend = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await onSend(trimmed);
    } catch {
      setText(trimmed); // restore on failure
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
      {/* Reply preview bar */}
      {replyTo ? (
        <XStack
          px="$3"
          py="$2"
          bg="$gray3"
          alignItems="center"
          gap="$2"
          borderBottomWidth={1}
          borderColor="$gray5"
        >
          <View width={3} alignSelf="stretch" borderRadius="$1" bg="$blue9" />
          <YStack flex={1} gap={2}>
            <Text
              fontSize="$1"
              fontWeight="600"
              color="$blue10"
              numberOfLines={1}
            >
              {replyTo.senderName || '消息'}
            </Text>
            <Text fontSize="$1" color="$gray11" numberOfLines={1}>
              {replyTo.text || (replyTo.hasMedia ? '[媒体]' : '')}
            </Text>
          </YStack>
          <TouchableOpacity onPress={onCancelReply} hitSlop={8}>
            <Text fontSize={18} color="$gray10">
              ✕
            </Text>
          </TouchableOpacity>
        </XStack>
      ) : null}

      <XStack px="$3" py="$2" gap="$2" alignItems="flex-end">
        <TextInput
          className="flex-1 min-h-9 max-h-[100px] rounded-[18px] bg-gray-500/10 px-4 py-2 text-[15px]"
          placeholder={placeholder}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !trimmed}
          className="w-9 h-9 rounded-[18px] justify-center items-center"
          style={{
            backgroundColor: trimmed ? '#007AFF' : 'rgba(128,128,128,0.2)',
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
        </TouchableOpacity>
      </XStack>
    </View>
  );
}
