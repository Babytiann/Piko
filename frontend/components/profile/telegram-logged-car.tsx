import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';

function getAvatarColor(id: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
  ];
  const index = Math.abs(parseInt(id, 10) || 0) % colors.length;
  return colors[index];
}

interface TelegramUserProps {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
  };
  handleUnbind: () => void;
}

export default function TelegramUser({
  user,
  handleUnbind,
}: TelegramUserProps) {
  return (
    <>
      <XStack gap="$3" items="center">
        <View
          style={[styles.avatar, { backgroundColor: getAvatarColor(user.id) }]}
        >
          <Text color="white" fontSize={20} fontWeight="600">
            {(user.firstName || user.username || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
              '未知用户'}
          </Text>
          {user.username ? (
            <Text fontSize="$2" color="$gray11">
              @{user.username}
            </Text>
          ) : null}
          {user.phone ? (
            <Text fontSize="$2" color="$gray11">
              {user.phone}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      <TouchableOpacity
        style={styles.unbindButton}
        onPress={handleUnbind}
        activeOpacity={0.8}
      >
        <Text color="#FF3B30" fontWeight="600" fontSize="$3">
          解除绑定
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unbindButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
