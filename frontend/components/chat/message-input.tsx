import { useState } from 'react';
import { TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { XStack, Text, View } from 'tamagui';

interface MessageInputProps {
  placeholder: string;
  onSend: (text: string) => Promise<void>;
  bottomInset?: number;
}

export default function MessageInput({
  placeholder,
  onSend,
  bottomInset = 0,
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
