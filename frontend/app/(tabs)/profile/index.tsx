import { useState, useEffect, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import PageLoading from '@/common/components/page-loading';
import PageStatusView, {
  PageErrorType,
} from '@/common/components/page-status-view';
import { useAuth } from '@/common/hooks';
import { unbindTelegram } from '@/services/telegram';

import { useProfileData } from '@/pages/profile/hooks/useProfileData';
import ProfileTelegramSection from '@/pages/profile/components/profile-telegram-section';

export default function ProfileScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, logout } = useAuth();
  const { isLoading, errorType, data, handleRetry } = useProfileData(session);
  const [isUnbinding, setIsUnbinding] = useState(false);

  // 检测到 AUTH 错误时自动弹窗提示并清除本地 session
  useEffect(() => {
    if (errorType !== PageErrorType.AUTH) return;

    Alert.alert(
      '登录已失效',
      'Telegram 登录已失效，请重新绑定账号。',
      [
        {
          text: '确定',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: false },
    );
  }, [errorType, logout]);

  const handleBind = (): void => {
    router.push('/telegram_login');
  };

  const handleUnbind = (): void => {
    Alert.alert(
      '解除绑定',
      '确定要解除 Telegram 账号绑定吗？解绑后将注销当前 Telegram 会话。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsUnbinding(true);
            try {
              if (session) {
                await unbindTelegram(session);
              }
            } catch (err) {
              console.error('unbind error:', err);
            } finally {
              await logout();
              setIsUnbinding(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || isUnbinding) return <PageLoading />;
  if (errorType && errorType !== PageErrorType.AUTH)
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
