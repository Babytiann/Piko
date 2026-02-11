import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TAB_BAR_CONTENT_HEIGHT } from '@/constants';
import { YStack, XStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import { usePageData } from '@/hooks/usePageData';
import { fetchProfilePage } from '@/services/profile';
import type { ProfilePageData } from '@/types/profile';
import PageLoading from '@/components/shared/pageLoading';
import PageError from '@/components/shared/pageStatusView';
import TelegramSection from '@/components/profile/telegram-section';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, logout } = useAuth();
  const { data, loading, error, refresh } = usePageData<ProfilePageData>(
    () => fetchProfilePage(session ?? undefined),
    [session],
  );

  const handleBind = () => router.push('/telegram_login');

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

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  return (
    <YStack
      flex={1}
      pt={insets.top}
      pb={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
      bg="$background"
    >
      <XStack px="$4" py="$3">
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          letterSpacing={-0.5}
        >
          {data.header.title}
        </Text>
        <Spacer flex={1} />
      </XStack>

      <YStack px="$4" gap="$4" flex={1}>
        <TelegramSection
          data={data.telegramSection}
          onBind={handleBind}
          onUnbind={handleUnbind}
        />
      </YStack>
    </YStack>
  );
}
