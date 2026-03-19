import { useState, useEffect, type ReactNode } from 'react';
import {
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import GoogleColorIcon from '@/common/components/google-color-icon';
import { PikoCard } from '@/common/components/piko-card';
import { useAuth } from '@/common/hooks';
import { authClient } from '@/services/auth-client';
import useLocation from '@/pages/ai-chat/hooks/useLocation';
import { fetchReverseGeocode } from '@/services/home';
import { fetchProfilePage, updateProfile } from '@/services/profile';
import type { ProfileAppUser } from '@/common/typings/profile';
import { BORDER, MUTED } from '@/common/consts/theme';

export default function AccountSettingsScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { getLocation } = useLocation();
  const { data: appSession } = authClient.useSession();
  const [profileData, setProfileData] = useState<{
    app_user: ProfileAppUser | null;
    telegram_bound: boolean;
  } | null>(null);
  const [nickname, setNickname] = useState('');
  const [weatherCity, setWeatherCity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [weatherSheetVisible, setWeatherSheetVisible] = useState(false);
  const [weatherCityInput, setWeatherCityInput] = useState('');
  const [savingWeather, setSavingWeather] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfilePage(session).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        const au = res.data.app_user;
        const telegramBound = res.data.telegram_section?.is_logged_in ?? false;
        setProfileData({
          app_user: au,
          telegram_bound: telegramBound,
        });
        setNickname(au?.nickname ?? au?.name ?? '');
        setWeatherCity(au?.weather_city ?? null);
      } else {
        setProfileData({
          app_user: appSession?.user
            ? {
                id: appSession.user.id,
                name: appSession.user.name ?? null,
                email: appSession.user.email ?? null,
              }
            : null,
          telegram_bound: false,
        });
        setNickname(appSession?.user?.name ?? '');
        setWeatherCity(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, appSession?.user]);

  const appUser =
    profileData?.app_user ??
    (appSession?.user
      ? {
          id: appSession.user.id,
          name: appSession.user.name ?? null,
          email: appSession.user.email ?? null,
          nickname: null,
        }
      : null);

  const handleSaveNickname = async (): Promise<void> => {
    if (!appUser || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await updateProfile({
        nickname: nickname.trim() || (appUser.name ?? ''),
      });
      if (res.success) {
        setProfileData((prev) =>
          prev && prev.app_user
            ? {
                ...prev,
                app_user: {
                  ...prev.app_user,
                  nickname: nickname.trim() || null,
                },
              }
            : prev,
        );
      } else {
        setSaveError(res.error ?? '保存失败');
      }
    } catch {
      setSaveError('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const openWeatherSheet = (): void => {
    setWeatherCityInput(weatherCity ?? '');
    setWeatherSheetVisible(true);
  };

  const handleUseCurrentLocation = async (): Promise<void> => {
    const loc = await getLocation();
    if (!loc) return;
    const res = await fetchReverseGeocode(loc.latitude, loc.longitude);
    if (res.success && res.data?.city) {
      setWeatherCityInput(res.data.city);
    }
  };

  const handleSaveWeatherCity = async (): Promise<void> => {
    if (!appUser || savingWeather) return;
    setSavingWeather(true);
    try {
      const value = weatherCityInput.trim() || null;
      const res = await updateProfile({ weather_city: value });
      if (res.success) {
        setWeatherCity(value);
        setProfileData((prev) =>
          prev && prev.app_user
            ? { ...prev, app_user: { ...prev.app_user, weather_city: value } }
            : prev,
        );
        setWeatherSheetVisible(false);
      }
    } finally {
      setSavingWeather(false);
    }
  };

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

  if (!appUser) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top} px="$4">
        <XStack
          style={{ paddingVertical: 8, paddingRight: 8 }}
          pressStyle={{ opacity: 0.8 }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.color.val} />
        </XStack>
        <Text fontSize="$4" color="$gray12" py="$4">
          请先登录
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={padding}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <XStack px="$4" py="$3" gap="$2" style={{ alignItems: 'center' }}>
            <XStack
              style={{ paddingVertical: 8, paddingRight: 8 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={theme.color.val} />
            </XStack>
            <Text fontSize="$6" fontWeight="700" color="$color">
              账号设置
            </Text>
          </XStack>

          <YStack px="$4" gap="$4" pt="$2">
            <PikoCard padding="$4">
              <YStack gap="$3">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  个人信息
                </Text>
                <YStack gap="$2">
                  <Text fontSize="$2" color="$gray12">
                    昵称
                  </Text>
                  <TextInput
                    value={nickname}
                    onChangeText={(t) => {
                      setNickname(t);
                      setSaveError(null);
                    }}
                    placeholder="输入昵称"
                    placeholderTextColor={MUTED}
                    style={{
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      color: theme.color.val,
                    }}
                  />
                  {saveError ? (
                    <Text fontSize="$2" color="$destructive">
                      {saveError}
                    </Text>
                  ) : null}
                  <XStack
                    py="$2"
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => void handleSaveNickname()}
                  >
                    <Text
                      fontSize="$4"
                      fontWeight="600"
                      color={saving ? '$gray12' : '$color'}
                    >
                      {saving ? '保存中…' : '保存'}
                    </Text>
                  </XStack>
                </YStack>
                <XStack
                  py="$2"
                  style={{
                    borderTopWidth: 0.5,
                    borderTopColor: '$gray4',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text fontSize="$2" color="$gray12">
                    邮箱
                  </Text>
                  <Text fontSize="$4" color="$color">
                    {appUser.email ?? '—'}
                  </Text>
                </XStack>
              </YStack>
            </PikoCard>

            <PikoCard padding="$4">
              <YStack gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  登录方式
                </Text>
                <XStack gap="$2" style={{ alignItems: 'center' }}>
                  {appUser.provider_id === 'google' ? (
                    <>
                      <GoogleColorIcon size={20} />
                      <Text fontSize="$4" color="$color">
                        Google 登录
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="logo-apple"
                        size={20}
                        color={theme.muted.val}
                      />
                      <Text fontSize="$4" color="$color">
                        Apple 登录
                      </Text>
                    </>
                  )}
                </XStack>
              </YStack>
            </PikoCard>

            <PikoCard padding="$4">
              <YStack gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$gray12">
                  Telegram
                </Text>
                <Text fontSize="$4" color="$color">
                  {profileData?.telegram_bound ? '已绑定' : '未绑定'}
                </Text>
              </YStack>
            </PikoCard>

            <Pressable onPress={openWeatherSheet}>
              <PikoCard padding="$4">
                <YStack gap="$2">
                  <Text fontSize="$2" fontWeight="600" color="$gray12">
                    天气城市
                  </Text>
                  <XStack
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text fontSize="$4" color="$color">
                      {weatherCity?.trim() || '自动定位'}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.gray10.val}
                    />
                  </XStack>
                </YStack>
              </PikoCard>
            </Pressable>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={weatherSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeatherSheetVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setWeatherSheetVisible(false)}
        >
          <Pressable
            style={{ backgroundColor: theme.background.val }}
            onPress={(e) => e.stopPropagation()}
          >
            <YStack p="$4" gap="$3">
              <Text fontSize="$5" fontWeight="600" color="$color">
                天气城市
              </Text>
              <Text fontSize="$2" color="$gray11">
                留空则使用自动定位
              </Text>
              <TextInput
                value={weatherCityInput}
                onChangeText={setWeatherCityInput}
                placeholder="例如：北京、上海"
                placeholderTextColor={MUTED}
                style={{
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: theme.color.val,
                }}
              />
              <XStack gap="$2">
                <Pressable
                  onPress={() => void handleUseCurrentLocation()}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: theme.gray4.val,
                    alignItems: 'center',
                  }}
                >
                  <Text fontSize="$3" color="$color">
                    使用当前位置
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSaveWeatherCity()}
                  disabled={savingWeather}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: theme.primary.val,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color={theme.primaryForeground?.val ?? '#fff'}
                  >
                    {savingWeather ? '保存中…' : '保存'}
                  </Text>
                </Pressable>
              </XStack>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </YStack>
  );
}
