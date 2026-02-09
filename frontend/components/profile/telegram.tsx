import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'tamagui';

interface TelegramProps {
  handleBindTelegram: () => void;
}

export default function Telegram({ handleBindTelegram }: TelegramProps) {
  return (
    <>
      <Text fontSize="$2" color="$gray11">
        绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。
      </Text>
      <TouchableOpacity
        style={styles.bindButton}
        onPress={handleBindTelegram}
        activeOpacity={0.8}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          绑定 Telegram 账号
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
