import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';
import { useAuth } from '@/common/hooks';

import { useProfileData } from '@/pages/profile/hooks/useProfileData';
import ProfileTelegramSection from '@/pages/profile/components/profile-telegram-section';

export default function ProfileScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, logout } = useAuth();
  const { isLoading, errorType, data, handleRetry } = useProfileData(session);

  const handleBind = (): void => {
    router.push('/telegram_login');
  };

  const handleUnbind = (): void => {
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

  if (isLoading) return <PageLoading />;
  if (errorType)
    return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
  if (!data) return <></>;

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
        <ProfileTelegramSection
          data={data.telegramSection}
          onBind={handleBind}
          onUnbind={handleUnbind}
        />
      </YStack>
    </YStack>
  );
}
