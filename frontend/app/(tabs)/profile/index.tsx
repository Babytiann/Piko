import { useEffect, useState, type ReactNode } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spacer } from 'tamagui';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';
import PageLoading from '@/common/components/page-loading';
import { PikoCard } from '@/common/components/piko-card';
import PageStatusView, {
  PageErrorType,
} from '@/common/components/page-status-view';
import { useAuth } from '@/common/hooks';
import { authClient } from '@/services/auth-client';
import { DEFAULT_PROFILE_LABELS } from '@/pages/profile/consts/default-labels';
import { useProfileData } from '@/pages/profile/hooks/useProfileData';
import ProfileAppleSection from '@/pages/profile/components/profile-apple-section';
import ProfileTelegramSection from '@/pages/profile/components/profile-telegram-section';
import ProfileSettingsSection from '@/pages/profile/components/profile-settings-section';

export default function ProfileScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: appSession } = authClient.useSession();
  const { session, logout } = useAuth();
  const { isPageLoading, errorType, data, handleRetry } = useProfileData(
    session,
    appSession?.user?.id,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (errorType !== PageErrorType.AUTH || !appSession?.user) return;

    Alert.alert(
      labels.alert_auth_expired_title,
      labels.alert_auth_expired_desc,
      [
        {
          text: labels.alert_auth_expired_ok,
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: false },
    );
  }, [errorType, appSession?.user, logout]);

  const labels = data?.labels ?? DEFAULT_PROFILE_LABELS;
  const appUser =
    data?.app_user ??
    (appSession?.user
      ? {
          id: appSession.user.id,
          name: appSession.user.name ?? null,
          email: appSession.user.email ?? null,
        }
      : null);

  const hasAppSession = !!appUser;
  const showProfileData = hasAppSession && data && !errorType;
  const showProfileError =
    hasAppSession && errorType && errorType !== PageErrorType.AUTH;

  const telegramSectionData = showProfileData
    ? data!.telegram_section
    : hasAppSession
      ? {
          title: 'Telegram 账号',
          is_logged_in: false,
          bind_prompt: '',
          bind_button_text: '',
        }
      : null;

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
      labels.alert_logout_title,
      labels.alert_logout_desc,
      [
        { text: labels.alert_logout_cancel, style: 'cancel' },
        { text: labels.alert_logout_ok, onPress: () => void handleAppLogout() },
      ],
      { cancelable: true },
    );
  };

  const handleTelegramPress = (): void => {
    const user = telegramSectionData?.is_logged_in
      ? telegramSectionData?.user
      : null;
    if (user) {
      router.push({
        pathname: '/telegram_binding',
        params: {
          username: user.username || '—',
          telegramUserId: user.telegram_user_id || '—',
          boundAt: user.bound_at ?? '',
        },
      });
    } else {
      router.push('/telegram_login');
    }
  };

  const SETTINGS_ROUTES = [
    '/notification-settings',
    '/privacy-security',
  ] as const;
  const HELP_ROUTES = ['/help-center', '/contact-us'] as const;

  const handleSettingsItemPress = (
    index: number,
    section: 'settings' | 'help',
  ): void => {
    const path =
      section === 'settings' ? SETTINGS_ROUTES[index] : HELP_ROUTES[index];
    if (path != null) router.push(path);
  };

  if (isPageLoading && !data) {
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
        <XStack px="$5" pt="$4" pb="$2" style={{ alignItems: 'center' }}>
          <Text
            fontSize={26}
            fontWeight="800"
            color="$color"
            letterSpacing={-0.5}
          >
            {labels.page_title}
          </Text>
          <Spacer flex={1} />
        </XStack>

        <YStack px="$4" gap="$3" pt="$1">
          <ProfileAppleSection
            appUser={appUser}
            labels={labels.user_section}
            onPress={() => router.push('/account-settings')}
          />

          {showProfileError ? (
            <PageStatusView errorType={errorType} onRetry={handleRetry} />
          ) : null}

          {telegramSectionData ? (
            <ProfileTelegramSection
              labels={labels.linked_account}
              data={telegramSectionData}
              onPress={handleTelegramPress}
            />
          ) : !hasAppSession ? (
            <PikoCard>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="600" color="$color">
                  {labels.linked_account.title}
                </Text>
                <Text fontSize="$2" color="$gray12">
                  {labels.linked_account.login_first_hint}
                </Text>
              </YStack>
            </PikoCard>
          ) : null}

          <ProfileSettingsSection
            labels={labels}
            onPressItem={handleSettingsItemPress}
          />

          {hasAppSession ? (
            <XStack
              py="$3"
              bg="$gray4"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                borderCurve: 'continuous',
                opacity: isLoggingOut ? 0.7 : 1,
              }}
              pressStyle={{ opacity: 0.8 }}
              onPress={isLoggingOut ? undefined : handleLogoutPress}
            >
              <Text color="$destructive" fontWeight="600" fontSize="$4">
                {isLoggingOut
                  ? labels.logout_ingress
                  : `${labels.logout_button} →`}
              </Text>
            </XStack>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
