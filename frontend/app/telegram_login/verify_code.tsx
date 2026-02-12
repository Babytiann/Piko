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

import CodeStep from '@/components/telegramLogin/tl-code-step';
import { useAppSafeArea } from '@/hooks/useSafeArea';

export default function VerifyCodeScreen() {
  const { top, bottom } = useAppSafeArea();
  const router = useRouter();
  const { login } = useAuth();
  const { phoneNumber, phoneCodeHash } = useLocalSearchParams<{
    phoneNumber: string;
    phoneCodeHash: string;
  }>();

  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!phoneCode.trim()) {
      setError('请输入验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.signIn(
        phoneNumber!,
        phoneCode,
        phoneCodeHash!,
      );

      if (result.require2FA) {
        router.push({
          pathname: '/telegram_login/verify_2fa',
          params: { session: result.session ?? '' },
        });
        return;
      }

      if (result.success && result.session && result.user) {
        await login(result.session, result.user);
        router.dismissAll();
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
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
                输入你收到的验证码
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            <CodeStep
              phoneNumber={phoneNumber ?? ''}
              phoneCode={phoneCode}
              onPhoneCodeChange={setPhoneCode}
              onSignIn={handleSignIn}
              onBack={() => router.back()}
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
