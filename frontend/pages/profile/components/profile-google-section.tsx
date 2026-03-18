import { useState, useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';
import { authClient } from '@/services/auth-client';

import type {
  ProfilePageLabels,
  ProfileAppUser,
} from '@/common/typings/profile';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export interface ProfileGoogleSectionProps {
  appUser: ProfileAppUser | null;
  labels: ProfilePageLabels['user_section'] & {
    google_login_label?: string;
  };
}

export default function ProfileGoogleSection({
  appUser,
  labels,
}: ProfileGoogleSectionProps): ReactNode {
  const theme = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);

  const handleGoogleSignIn = async (): Promise<void> => {
    if (!WEB_CLIENT_ID) {
      console.warn(
        '[Google Sign In] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set',
      );
      return;
    }
    setIsSigningIn(true);
    try {
      const response: SignInResponse = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data?.idToken) {
        if (response.type === 'cancelled') return;
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
      }
    } catch (err) {
      console.error('[Google Sign In]', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (appUser) return null;

  const googleLabel = labels.google_login_label ?? '使用 Google 登录';

  return (
    <PikoCard>
      <YStack gap="$3">
        <Text fontSize="$2" color="$gray12">
          {labels.sign_in_prompt}
        </Text>
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
          onPress={WEB_CLIENT_ID ? () => void handleGoogleSignIn() : undefined}
          disabled={isSigningIn || !WEB_CLIENT_ID}
        >
          <Ionicons name="logo-google" size={20} color={theme.gray12.val} />
          <Text fontSize="$4" fontWeight="600" color="$color" ml="$2">
            {isSigningIn ? '登录中…' : googleLabel}
          </Text>
        </XStack>
        {!WEB_CLIENT_ID ? (
          <Text fontSize="$1" color="$gray10">
            请配置 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 以启用 Google 登录
          </Text>
        ) : null}
      </YStack>
    </PikoCard>
  );
}
