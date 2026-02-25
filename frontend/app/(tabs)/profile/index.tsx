import { useEffect, useState, type ReactNode } from 'react';
import { Alert, ScrollView } from 'react-native';
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

import { DEFAULT_PROFILE_COPY } from '@/pages/profile/consts/default-copy';
import { useProfileData } from '@/pages/profile/hooks/useProfileData';
import ProfileAppleSection from '@/pages/profile/components/profile-apple-section';
import ProfileTelegramSection from '@/pages/profile/components/profile-telegram-section';
import ProfileSettingsSection from '@/pages/profile/components/profile-settings-section';

export default function ProfileScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: appSession } = authClient.useSession();
  const { session, logout } = useAuth();
  const { isLoading, errorType, data, handleRetry } = useProfileData(
    session,
    appSession?.user?.id,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const copy = data?.copy ?? DEFAULT_PROFILE_COPY;
  const appUser =
    data?.appUser ??
    (appSession?.user
      ? {
          id: appSession.user.id,
          name: appSession.user.name ?? null,
          email: appSession.user.email ?? null,
        }
      : null);

  const hasAppSession = !!appUser;

  if (isLoading && !data) {
    return (
      <YStack flex={1} bg="$background">
        <PageLoading />
      </YStack>
    );
  }

  if (errorType && errorType !== PageErrorType.AUTH) {
    return (
      <YStack flex={1} bg="$background">
        <PageStatusView errorType={errorType} onRetry={handleRetry} />
      </YStack>
    );
  }

  const handleAppLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutPress = (): void => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: () => void handleAppLogout() },
      ],
      { cancelable: true },
    );
  };

  const handleTelegramPress = (): void => {
    const user = telegramSectionData?.isLoggedIn
      ? telegramSectionData?.user
      : null;
    if (user) {
      router.push({
        pathname: '/telegram_binding',
        params: {
          username: user.username || '—',
          telegramUserId: user.telegramUserId || '—',
          boundAt: user.boundAt ?? '',
        },
      });
    } else {
      router.push('/telegram_login');
    }
  };

  const showProfileData = hasAppSession && data && !errorType;
  const showProfileError =
    hasAppSession && errorType && errorType !== PageErrorType.AUTH;

  const telegramSectionData = showProfileData
    ? data!.telegramSection
    : hasAppSession
      ? {
          title: 'Telegram 账号',
          isLoggedIn: false,
          bindPrompt: '',
          bindButtonText: '',
        }
      : null;

  const contentPadding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + TAB_BAR_CONTENT_HEIGHT,
  };

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={contentPadding}
        showsVerticalScrollIndicator={false}
      >
        <XStack px="$4" py="$3">
          <Text
            fontSize="$7"
            fontWeight="700"
            color="$color"
            letterSpacing={-0.5}
          >
            {copy.pageTitle}
          </Text>
          <Spacer flex={1} />
        </XStack>

        <YStack px="$4" gap="$4">
          <ProfileAppleSection appUser={appUser} copy={copy.userSection} />

          {showProfileError ? (
            <PageStatusView errorType={errorType} onRetry={handleRetry} />
          ) : null}

          {telegramSectionData ? (
            <ProfileTelegramSection
              copy={copy.linkedAccount}
              data={telegramSectionData}
              onPress={handleTelegramPress}
            />
          ) : !hasAppSession ? (
            <YStack bg="#FFFFFF" p="$4" gap="$3" style={{ borderRadius: 16 }}>
              <Text fontSize="$4" fontWeight="600" color="$color">
                {copy.linkedAccount.title}
              </Text>
              <Text fontSize="$2" color="$gray12">
                {copy.linkedAccount.loginFirstHint}
              </Text>
            </YStack>
          ) : null}

          <ProfileSettingsSection copy={copy} />

          {hasAppSession ? (
            <YStack
              py="$2"
              bg="#FFFFFF"
              style={{
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              pressStyle={isLoggingOut ? undefined : { opacity: 0.8 }}
              onPress={isLoggingOut ? undefined : handleLogoutPress}
              height={50}
              opacity={isLoggingOut ? 0.7 : 1}
            >
              <XStack gap="$2" style={{ alignItems: 'center' }}>
                <Text color="$red10" fontWeight="600" fontSize="$4">
                  {isLoggingOut ? copy.logoutIngress : copy.logoutButton}
                </Text>
                {isLoggingOut ? null : (
                  <Text color="$red10" fontSize="$4">
                    →
                  </Text>
                )}
              </XStack>
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
