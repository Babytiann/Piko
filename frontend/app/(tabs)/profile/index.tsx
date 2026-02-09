import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/hooks/use-auth';
import Telegram from '@/components/profile/telegram';
import TelegramUser from '@/components/profile/telegram-logged-car';

const TAB_BAR_OFFSET = 56 + 16 + 16;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  const handleBindTelegram = () => {
    router.push('/telegram_login');
  };

  const handleUnbind = () => {
    Alert.alert('解除绑定', '确定要解除 Telegram 账号绑定吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <YStack
      flex={1}
      pt={insets.top}
      pb={insets.bottom + TAB_BAR_OFFSET}
      bg="$background"
    >
      {/* Header */}
      <XStack px="$4" py="$3">
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          letterSpacing={-0.5}
        >
          个人中心
        </Text>
        <Spacer flex={1} />
      </XStack>

      <YStack px="$4" gap="$4" flex={1}>
        {/* Telegram Binding Section */}
        <YStack bg="$gray2" borderRadius="$4" p="$4" gap="$3">
          <Text fontSize="$4" fontWeight="600" color="$color">
            Telegram 账号
          </Text>

          {isLoggedIn && user ? (
            <TelegramUser user={user} handleUnbind={handleUnbind} />
          ) : (
            <Telegram handleBindTelegram={handleBindTelegram} />
          )}
        </YStack>
      </YStack>
    </YStack>
  );
}
