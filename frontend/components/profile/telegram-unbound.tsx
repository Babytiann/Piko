import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'tamagui';

interface TelegramUnboundProps {
  prompt: string;
  buttonText: string;
  onBind: () => void;
}

export default function TelegramUnbound({
  prompt,
  buttonText,
  onBind,
}: TelegramUnboundProps) {
  return (
    <>
      <Text fontSize="$2" color="$gray11">
        {prompt}
      </Text>
      <TouchableOpacity
        style={styles.bindButton}
        onPress={onBind}
        activeOpacity={0.8}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {buttonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  bindButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
