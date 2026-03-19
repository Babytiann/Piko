import { useState, useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';
import { YStack, XStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';
import GoogleColorIcon from '@/common/components/google-color-icon';
import { authClient } from '@/services/auth-client';

import type {
  ProfilePageLabels,
  ProfileAppUser,
} from '@/common/typings/profile';

/** Web 客户端 ID：用于 idToken 的 audience，需与 Better Auth 后端 Google clientId 一致 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
/**
 * iOS 客户端 ID：Google Cloud「iOS」类型 OAuth 客户端（与 Web 客户端 ID 不同）。
 * 无 Firebase 的 GoogleService-Info.plist 时，iOS 必须提供此项，否则 RNGoogleSignin 报错。
 */
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

function googleSignInReady(): boolean {
  if (!WEB_CLIENT_ID) return false;
  if (Platform.OS === 'ios' && !IOS_CLIENT_ID) return false;
  return true;
}

export interface ProfileGoogleSectionProps {
  appUser: ProfileAppUser | null;
  labels: ProfilePageLabels['user_section'] & {
    google_login_label?: string;
  };
  onLoginSuccess?: () => void;
}

export default function ProfileGoogleSection({
  appUser,
  labels,
  onLoginSuccess,
}: ProfileGoogleSectionProps): ReactNode {
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!WEB_CLIENT_ID) return;
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      ...(Platform.OS === 'ios' && IOS_CLIENT_ID
        ? { iosClientId: IOS_CLIENT_ID }
        : {}),
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignIn = async (): Promise<void> => {
    if (!googleSignInReady()) {
      console.warn(
        Platform.OS === 'ios'
          ? '[Google Sign In] 请在 .env 配置 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 与 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID（Google Cloud → iOS 类型客户端）'
          : '[Google Sign In] 请配置 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
      );
      return;
    }
    setIsSigningIn(true);
    try {
      const response: SignInResponse = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data?.idToken) {
        setIsSigningIn(false);
        return;
      }
      const idToken = response.data.idToken;
      const { accessToken } = await GoogleSignin.getTokens();
      const { error } = await authClient.signIn.social({
        provider: 'google',
        idToken: {
          token: idToken,
          accessToken,
        },
        callbackURL: '/(tabs)/profile',
      });
      if (error) {
        console.error('[Google Sign In]', error);
        setIsSigningIn(false);
      } else {
        // 主动刷新 session，使 useSession() 立即感知到登录态，减少 loading 时间
        await authClient.getSession();
        onLoginSuccess?.();
      }
    } catch (err) {
      console.error('[Google Sign In]', err);
      setIsSigningIn(false);
    }
  };

  if (appUser) return null;

  const googleLabel = labels.google_login_label ?? '使用 Google 登录';

  return (
    <PikoCard>
      <YStack gap="$3">
        <XStack
          bg="$gray4"
          py="$2.5"
          px="$4"
          style={{
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isSigningIn ? 0.7 : 1,
          }}
          pressStyle={{ opacity: 0.85 }}
          onPress={
            googleSignInReady() ? () => void handleGoogleSignIn() : undefined
          }
          disabled={isSigningIn || !googleSignInReady()}
        >
          <GoogleColorIcon size={20} />
          <Text fontSize="$4" fontWeight="600" color="$color" ml="$2">
            {isSigningIn ? '登录中…' : googleLabel}
          </Text>
        </XStack>
        {!googleSignInReady() ? (
          <Text fontSize="$1" color="$gray10">
            {Platform.OS === 'ios'
              ? 'iOS 需配置 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID（Web 客户端）与 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID（Google Cloud 中「iOS」OAuth 客户端 ID，Bundle ID 须与 app 一致）'
              : '请配置 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'}
          </Text>
        ) : null}
      </YStack>
    </PikoCard>
  );
}
