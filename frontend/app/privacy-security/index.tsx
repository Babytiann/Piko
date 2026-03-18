import { useState, type ReactNode } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PikoCard } from '@/common/components/piko-card';
import { clear as clearRouteCache } from '@/common/lib/route-cache';
import { useAuth } from '@/common/hooks';
import { authClient } from '@/services/auth-client';
import { clearUserData, deleteAccount } from '@/services/profile';

const CONVERSATION_CACHE_KEY = 'ai:conversation:list:v1';

export default function PrivacySecurityScreen(): ReactNode {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const [clearingLocal, setClearingLocal] = useState(false);
  const [clearingCloud, setClearingCloud] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 24,
  };

  const handleClearLocalCache = (): void => {
    Alert.alert(
      '清除本地缓存',
      '将清除本机上的对话列表等缓存数据，不影响云端数据。确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          onPress: async () => {
            setClearingLocal(true);
            try {
              clearRouteCache();
              await AsyncStorage.removeItem(CONVERSATION_CACHE_KEY);
              Alert.alert('已清除', '本地缓存已清除。');
            } catch (err) {
              console.error('clear local cache error:', err);
              Alert.alert('清除失败', '请稍后重试。');
            } finally {
              setClearingLocal(false);
            }
          },
        },
      ],
    );
  };

  const handleClearCloudData = (): void => {
    Alert.alert(
      '清除云端数据',
      '将删除你的消费记录、AI 对话和预算设置，账号与登录状态保留。此操作不可恢复，确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          onPress: async () => {
            setClearingCloud(true);
            try {
              const res = await clearUserData();
              if (res.success) {
                Alert.alert('已清除', '云端业务数据已清除。');
              } else {
                Alert.alert('清除失败', res.error ?? '请稍后重试。');
              }
            } catch (err) {
              console.error('clear cloud data error:', err);
              Alert.alert('清除失败', '请稍后重试。');
            } finally {
              setClearingCloud(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      '删除账号',
      '删除后，你的账号及所有相关数据将被永久删除且无法恢复。确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '继续',
          onPress: () => {
            Alert.alert('最后确认', '此操作不可恢复。确定要删除账号吗？', [
              { text: '取消', style: 'cancel' },
              {
                text: '删除账号',
                style: 'destructive',
                onPress: async () => {
                  setDeleting(true);
                  try {
                    const res = await deleteAccount();
                    if (res.success) {
                      await authClient.signOut();
                      await logout();
                      router.replace('/(tabs)/profile');
                    } else {
                      Alert.alert('删除失败', res.error ?? '请稍后重试。');
                    }
                  } catch (err) {
                    console.error('delete account error:', err);
                    Alert.alert('删除失败', '请稍后重试。');
                  } finally {
                    setDeleting(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <YStack flex={1} bg="$background">
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
            <Ionicons name="chevron-back" size={24} color={theme.color.val} />
          </XStack>
          <Text fontSize="$6" fontWeight="700" color="$color">
            隐私与安全
          </Text>
        </XStack>

        <YStack px="$4" gap="$4" pt="$2">
          <PikoCard padding="$4">
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$gray12">
                数据安全
              </Text>
              <Text fontSize="$3" color="$gray12">
                你的数据在传输与存储时均受保护。我们不会将你的个人数据用于未经授权的用途。
              </Text>
            </YStack>
          </PikoCard>

          <PikoCard padding="$4">
            <YStack gap="$3">
              <Text fontSize="$2" fontWeight="600" color="$gray12">
                数据管理
              </Text>
              <XStack
                py="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 0.5,
                  borderBottomColor: '$gray4',
                }}
                pressStyle={{ opacity: 0.8 }}
                onPress={clearingLocal ? undefined : handleClearLocalCache}
              >
                <Text fontSize="$4" color="$color">
                  清除本地缓存
                </Text>
                <Text fontSize="$2" color="$gray12">
                  {clearingLocal ? '处理中…' : '清除对话等本地缓存'}
                </Text>
              </XStack>
              <XStack
                py="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 0.5,
                  borderBottomColor: '$gray4',
                }}
                pressStyle={{ opacity: 0.8 }}
                onPress={clearingCloud ? undefined : handleClearCloudData}
              >
                <Text fontSize="$4" color="$color">
                  清除云端数据
                </Text>
                <Text fontSize="$2" color="$gray12">
                  {clearingCloud ? '处理中…' : '删除消费、对话、预算，保留账号'}
                </Text>
              </XStack>
              <XStack
                py="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                pressStyle={deleting ? undefined : { opacity: 0.8 }}
                onPress={deleting ? undefined : handleDeleteAccount}
              >
                <Text fontSize="$4" color="$destructive">
                  删除账号
                </Text>
                <Text fontSize="$2" color="$gray12">
                  {deleting ? '处理中…' : '永久删除账号及全部数据'}
                </Text>
              </XStack>
            </YStack>
          </PikoCard>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
