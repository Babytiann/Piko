import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import * as telegramApi from '@/services/telegram';

import PhoneStep from '@/components/telegram-login/PhoneStep';
import CodeStep from '@/components/telegram-login/CodeStep';
import TwoFAStep from '@/components/telegram-login/TwoFAStep';
import { getCodeByName } from '@/components/telegram-login/CountryCodeSelect';

type Step = 'phone' | 'code' | '2fa';

export default function TelegramLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [countryName, setCountryName] = useState('中国');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [tempSession, setTempSession] = useState('');

  const fullPhoneNumber = `${getCodeByName(countryName)}${phoneNumber.trim()}`;

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.sendCode(fullPhoneNumber);
      setPhoneCodeHash(result.phoneCodeHash);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!phoneCode.trim()) {
      setError('请输入验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.signIn(
        fullPhoneNumber,
        phoneCode,
        phoneCodeHash,
      );

      if (result.require2FA) {
        setTempSession(result.session ?? '');
        setStep('2fa');
        return;
      }

      if (result.success && result.session && result.user) {
        await login(result.session, result.user);
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPassword = async () => {
    if (!password.trim()) {
      setError('请输入两步验证密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.checkPassword(tempSession, password);
      if (result.success) {
        await login(result.session, result.user);
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
          <YStack
            flex={1}
            pt={insets.top + 20}
            pb={insets.bottom + 20}
            px="$6"
            bg="$background"
          >
            <View style={styles.headerCenter}>
              <Text fontSize={24} fontWeight="700" color="$color">
                绑定 Telegram 账号
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                {step === 'phone' && '输入你的手机号以连接 Telegram'}
                {step === 'code' && '输入你收到的验证码'}
                {step === '2fa' && '输入你的两步验证密码'}
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            {step === 'phone' && (
              <PhoneStep
                phoneNumber={phoneNumber}
                onPhoneNumberChange={setPhoneNumber}
                countryName={countryName}
                onCountryChange={setCountryName}
                onSendCode={handleSendCode}
                loading={loading}
              />
            )}

            {step === 'code' && (
              <CodeStep
                phoneNumber={fullPhoneNumber}
                phoneCode={phoneCode}
                onPhoneCodeChange={setPhoneCode}
                onSignIn={handleSignIn}
                onBack={() => {
                  setStep('phone');
                  setError('');
                }}
                loading={loading}
              />
            )}

            {step === '2fa' && (
              <TwoFAStep
                password={password}
                onPasswordChange={setPassword}
                onCheckPassword={handleCheckPassword}
                loading={loading}
              />
            )}

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
