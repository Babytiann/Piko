import { useState, type ReactNode } from 'react';
import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, View, useTheme } from 'tamagui';

import Avatar from '@/common/components/avatar';
import { PikoCard } from '@/common/components/piko-card';
import { authClient } from '@/services/auth-client';
import { uploadAvatar } from '@/services/profile';

import type {
  ProfilePageLabels,
  ProfileAppUser,
} from '@/common/typings/profile';

interface ProfileAppleSectionProps {
  appUser: ProfileAppUser | null;
  labels: ProfilePageLabels['user_section'];
  onPress?: () => void;
  onAvatarUpdate?: (url: string) => void;
  onLoginSuccess?: () => void;
}

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#6C5CE7',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfileAppleSection({
  appUser,
  labels,
  onPress,
  onAvatarUpdate,
  onLoginSuccess,
}: ProfileAppleSectionProps): ReactNode {
  const theme = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

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
        setIsSigningIn(false);
      } else {
        // 主动刷新 session，使 useSession() 立即感知到登录态，减少 loading 时间
        await authClient.getSession();
        onLoginSuccess?.();
      }
    } catch (err) {
      if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
        setIsSigningIn(false);
        return;
      }
      console.error('[Apple Sign In]', err);
      setIsSigningIn(false);
    }
  };

  const pickAndUploadAvatar = async (useCamera: boolean): Promise<void> => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets[0]?.base64) return;

      const asset = result.assets[0];
      setUploading(true);
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const res = await uploadAvatar(asset.base64, mimeType);
      if (res.success && res.data?.avatar_url) {
        setLocalAvatarUrl(asset.uri);
        onAvatarUpdate?.(res.data.avatar_url);
      }
    } catch (err) {
      console.error('[Avatar Upload]', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarPress = (): void => {
    if (!appUser || uploading) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '拍照', '从相册选择'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void pickAndUploadAvatar(true);
          if (index === 2) void pickAndUploadAvatar(false);
        },
      );
    } else {
      Alert.alert('更换头像', '', [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: () => void pickAndUploadAvatar(true) },
        { text: '从相册选择', onPress: () => void pickAndUploadAvatar(false) },
      ]);
    }
  };

  const displayName = appUser?.nickname ?? appUser?.name ?? null;
  const avatarUrl = localAvatarUrl ?? appUser?.avatar_url ?? undefined;
  const avatarColor = appUser ? getAvatarColor(appUser.id) : theme.muted.val;
  const avatarText = (displayName ?? appUser?.email ?? '?')
    .charAt(0)
    .toUpperCase();

  return (
    <PikoCard onPress={appUser ? onPress : undefined}>
      <YStack gap="$3">
        {appUser ? (
          <XStack gap="$4" style={{ alignItems: 'center' }}>
            <View>
              <View pressStyle={{ opacity: 0.8 }} onPress={handleAvatarPress}>
                <Avatar
                  url={avatarUrl}
                  text={avatarText}
                  color={avatarColor}
                  size={72}
                />
                <View
                  position="absolute"
                  bottom={0}
                  right={0}
                  width={24}
                  height={24}
                  bg="$primary"
                  style={{
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.card.val,
                  }}
                >
                  <Ionicons
                    name="camera"
                    size={12}
                    color={theme.primaryForeground.val}
                  />
                </View>
              </View>
            </View>
            <YStack flex={1} gap="$1">
              <Text fontSize={20} fontWeight="700" color="$color">
                {displayName ?? appUser.email ?? '—'}
              </Text>
              {uploading ? (
                <Text fontSize="$2" color="$gray11">
                  头像上传中…
                </Text>
              ) : null}
            </YStack>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.muted.val}
            />
          </XStack>
        ) : (
          <>
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
