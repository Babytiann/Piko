import { useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { YStack, XStack, Text } from 'tamagui';

import { authClient } from '@/services/auth-client';

interface ProfileAppleSectionProps {
  onLogout: () => Promise<void>;
}

export default function ProfileAppleSection({
  onLogout,
}: ProfileAppleSectionProps): ReactNode {
  const { data: session, isPending } = authClient.useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      await onLogout();
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <YStack bg="$gray2" p="$4" gap="$3" style={{ borderRadius: 16 }}>
        <Text fontSize="$4" fontWeight="600" color="$color">
          Apple 账号
        </Text>
        <Text fontSize="$2" color="$gray11">
          加载中…
        </Text>
      </YStack>
    );
  }

  return (
    <YStack bg="$gray2" p="$4" gap="$3" style={{ borderRadius: 16 }}>
      <Text fontSize="$4" fontWeight="600" color="$color">
        Apple 账号
      </Text>

      {session?.user ? (
        <>
          <XStack gap="$2" flexWrap="wrap">
            <Text fontSize="$3" color="$color">
              {session.user.email ?? '已通过 Apple 登录'}
            </Text>
          </XStack>
          <YStack
            height={44}
            bg="$red2"
            pressStyle={{ opacity: 0.8 }}
            onPress={() => void handleSignOut()}
            style={{
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text color="$red10" fontWeight="600" fontSize="$3">
              {isSigningOut ? '退出中…' : '退出登录'}
            </Text>
          </YStack>
        </>
      ) : (
        <>
          <Text fontSize="$2" color="$gray11">
            使用 Apple 账号登录后可使用 AI 聊天等功能。
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
              disabled={isSigningIn}
            />
          ) : (
            <Text fontSize="$2" color="$gray11">
              请在 iOS 设备上使用 Apple 登录。
            </Text>
          )}
        </>
      )}
    </YStack>
  );
}
