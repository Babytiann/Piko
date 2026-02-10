import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import * as telegramApi from '@/services/telegram';

import TwoFAStep from '@/components/telegram-login/TwoFAStep';
import { useAppSafeArea } from '@/hooks/useSafeArea';

export default function Verify2FAScreen() {
  const { top, bottom } = useAppSafeArea();
  const router = useRouter();
  const { login } = useAuth();
  const { session } = useLocalSearchParams<{ session: string }>();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckPassword = async () => {
    if (!password.trim()) {
      setError('请输入两步验证密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.checkPassword(session!, password);
      if (result.success) {
        await login(result.session, result.user);
        router.dismissAll();
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <YStack flex={1} pt={top} pb={bottom} px="$6" bg="$background">
            <View style={styles.headerCenter}>
              <Text fontSize={24} fontWeight="700" color="$color">
                绑定 Telegram 账号
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                输入你的两步验证密码
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            <TwoFAStep
              password={password}
              onPasswordChange={setPassword}
              onCheckPassword={handleCheckPassword}
              loading={loading}
            />

            <Spacer flex={1} />
          </YStack>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
});
