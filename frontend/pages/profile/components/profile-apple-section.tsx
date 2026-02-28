import { useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';

import Avatar from '@/common/components/avatar';
import { PikoCard } from '@/common/components/piko-card';
import { authClient } from '@/services/auth-client';

import type {
  ProfilePageLabels,
  ProfileAppUser,
} from '@/common/typings/profile';

interface ProfileAppleSectionProps {
  appUser: ProfileAppUser | null;
  labels: ProfilePageLabels['user_section'];
}

export default function ProfileAppleSection({
  appUser,
  labels,
}: ProfileAppleSectionProps): ReactNode {
  const theme = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleAppleSignIn = async (): Promise<void> => {
    if (Platform.OS !== 'ios') return;
    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        return;
      }
      const { error } = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: credential.identityToken },
        callbackURL: '/(tabs)/profile',
      });
      if (error) {
        console.error('[Apple Sign In]', error);
      }
    } catch (err) {
      if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.error('[Apple Sign In]', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <PikoCard>
      <YStack gap="$3">
        {appUser ? (
          <XStack gap="$3" style={{ alignItems: 'center' }}>
            <Avatar
              url={undefined}
              text={(appUser.name ?? appUser.email ?? '?').charAt(0)}
              color={theme.muted.val}
              size={56}
            />
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color">
                {appUser.name ?? appUser.email ?? '—'}
              </Text>
              {appUser.email ? (
                <Text fontSize="$3" color="$gray12">
                  {appUser.email}
                </Text>
              ) : null}
              <XStack gap="$2" style={{ alignItems: 'center' }}>
                <Text fontSize="$2" color="$gray12">
                  {labels.apple_login_label}
                </Text>
                <Ionicons name="logo-apple" size={14} color={theme.muted.val} />
              </XStack>
            </YStack>
          </XStack>
        ) : (
          <>
            <Text fontSize="$2" color="$gray12">
              {labels.sign_in_prompt}
            </Text>
            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={12}
                style={{ height: 44, width: '100%' }}
                onPress={() => void handleAppleSignIn()}
              />
            ) : (
              <Text fontSize="$2" color="$gray12">
                {labels.ios_only_hint}
              </Text>
            )}
          </>
        )}
      </YStack>
    </PikoCard>
  );
}
