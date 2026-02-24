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
import { authClient } from '@/services/auth-client';
import { unbindTelegram } from '@/services/telegram';

import { useProfileData } from '@/pages/profile/hooks/useProfileData';
import ProfileAppleSection from '@/pages/profile/components/profile-apple-section';
import ProfileTelegramSection from '@/pages/profile/components/profile-telegram-section';

export default function ProfileScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: appSession } = authClient.useSession();
  const { session, logout } = useAuth();
  const { isLoading, errorType, data, handleRetry } = useProfileData(session);
  const [isUnbinding, setIsUnbinding] = useState(false);

  const handleAppLogout = async (): Promise<void> => {
    await logout();
  };

  // 已登录 Apple 且接口返回 AUTH 时，视为 Telegram 失效，弹窗并清除
  useEffect(() => {
    if (errorType !== PageErrorType.AUTH || !appSession?.user) return;

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
  }, [errorType, appSession?.user, logout]);

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

  if (isUnbinding) return <PageLoading />;

  const hasAppSession = !!appSession?.user;
  const showProfileData = hasAppSession && data && !errorType;
  const showProfileError =
    hasAppSession && errorType && errorType !== PageErrorType.AUTH;

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
          个人中心
        </Text>
        <Spacer flex={1} />
      </XStack>

      <YStack px="$4" gap="$4" flex={1}>
        <ProfileAppleSection onLogout={handleAppLogout} />

        {showProfileError ? (
          <PageStatusView errorType={errorType} onRetry={handleRetry} />
        ) : null}
        {showProfileData ? (
          <ProfileTelegramSection
            data={data!.telegramSection}
            onBind={handleBind}
            onUnbind={handleUnbind}
          />
        ) : hasAppSession && isLoading ? (
          <PageLoading />
        ) : hasAppSession ? (
          <ProfileTelegramSection
            data={{
              title: 'Telegram 账号',
              isLoggedIn: false,
              bindPrompt:
                '绑定 Telegram 账号后，可以查看和管理你的 Telegram 消息。',
              bindButtonText: '绑定 Telegram 账号',
            }}
            onBind={handleBind}
            onUnbind={handleUnbind}
          />
        ) : (
          <YStack bg="$gray2" p="$4" gap="$3" style={{ borderRadius: 16 }}>
            <Text fontSize="$4" fontWeight="600" color="$color">
              Telegram 账号
            </Text>
            <Text fontSize="$2" color="$gray11">
              登录后可在此绑定 Telegram 账号。
            </Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
