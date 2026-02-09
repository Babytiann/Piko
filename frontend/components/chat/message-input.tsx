import { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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
          style={styles.input}
          placeholder={placeholder}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !trimmed}
          style={[
            styles.sendButton,
            { backgroundColor: trimmed ? '#007AFF' : 'rgba(128,128,128,0.2)' },
          ]}
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

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
