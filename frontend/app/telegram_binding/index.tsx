import { useState, type ReactNode } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text } from 'tamagui';

import {
  PRIMARY,
  MUTED,
  BORDER,
  CARD_BACKGROUND,
  WARNING,
} from '@/common/consts/theme';
import { useAuth } from '@/common/hooks';
import { unbindTelegram } from '@/services/telegram';

function formatBoundAt(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return '—';
  }
}

const FUNCTION_ITEMS = [
  '通过 Telegram 接收重要通知和提醒',
  '快速登录和身份验证',
  '与其他用户安全通讯',
];

export default function TelegramBindingScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    username?: string;
    telegramUserId?: string;
    boundAt?: string;
  }>();
  const { session, logout } = useAuth();
  const [isUnbinding, setIsUnbinding] = useState(false);

  const username = params.username ?? '—';
  const telegramUserId = params.telegramUserId ?? '—';
  const boundAtFormatted = formatBoundAt(params.boundAt);

  const handleUnbind = (): void => {
    Alert.alert(
      '解除绑定',
      '解绑后，你将无法通过 Telegram 接收通知，且需要重新绑定才能恢复相关功能。确定要解除绑定吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解除绑定',
          style: 'destructive',
          onPress: async () => {
            setIsUnbinding(true);
            try {
              if (session) {
                await unbindTelegram(session);
              }
              await logout();
              router.back();
            } catch (err) {
              console.error('unbind error:', err);
            } finally {
              setIsUnbinding(false);
            }
          },
        },
      ],
    );
  };

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

  return (
    <YStack flex={1} bg="$gray2">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={padding}
        showsVerticalScrollIndicator={false}
      >
        <XStack px="$4" py="$3" gap="$2" style={{ alignItems: 'center' }}>
          <XStack
            style={{ paddingVertical: 8, paddingRight: 8 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </XStack>
          <Text fontSize="$6" fontWeight="700" color="$color">
            Telegram 绑定
          </Text>
        </XStack>

        <YStack px="$4" gap="$5" pt="$2">
          <YStack py="$4" style={{ alignItems: 'center' }}>
            <YStack
              width={80}
              height={80}
              bg="$gray4"
              style={{
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="paper-plane" size={40} color={MUTED} />
            </YStack>
          </YStack>

          <YStack
            bg={CARD_BACKGROUND}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            <YStack
              px="$4"
              py="$3"
              style={{ borderBottomWidth: 1, borderColor: BORDER }}
            >
              <Text fontSize="$2" color="$gray12">
                用户名
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$color" mt="$1">
                {username}
              </Text>
            </YStack>
            <YStack
              px="$4"
              py="$3"
              style={{ borderBottomWidth: 1, borderColor: BORDER }}
            >
              <Text fontSize="$2" color="$gray12">
                用户 ID
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$color" mt="$1">
                {telegramUserId}
              </Text>
            </YStack>
            <YStack px="$4" py="$3">
              <Text fontSize="$2" color="$gray12">
                绑定时间
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$color" mt="$1">
                {boundAtFormatted}
              </Text>
            </YStack>
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              功能说明
            </Text>
            <YStack gap="$2" pl="$2">
              {FUNCTION_ITEMS.map((item) => (
                <XStack key={item} gap="$2" style={{ alignItems: 'center' }}>
                  <Text fontSize="$2" color="$gray12">
                    •
                  </Text>
                  <Text fontSize="$3" color="$gray12" flex={1}>
                    {item}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>

          <XStack
            bg="$gray2"
            p="$4"
            gap="$3"
            style={{ borderRadius: 12, borderWidth: 1, borderColor: BORDER }}
          >
            <Ionicons name="warning" size={22} color={WARNING} />
            <YStack flex={1} gap="$1">
              <Text fontSize="$3" fontWeight="600" color="$color">
                解绑提示
              </Text>
              <Text fontSize="$2" color="$gray12">
                解绑后，你将无法通过 Telegram
                接收通知，且需要重新绑定才能恢复相关功能。
              </Text>
            </YStack>
          </XStack>

          <YStack
            bg={CARD_BACKGROUND}
            py="$3"
            style={{
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pressStyle={isUnbinding ? undefined : { opacity: 0.8 }}
            onPress={isUnbinding ? undefined : handleUnbind}
          >
            <Text color="$destructive" fontWeight="600" fontSize="$4">
              {isUnbinding ? '解除中…' : '解除绑定'}
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
