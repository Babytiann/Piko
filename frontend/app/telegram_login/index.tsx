import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, Text, Spacer } from 'tamagui';
import * as telegramApi from '@/services/telegram';

import PhoneStep from '@/components/telegramLogin/tl-phone-step';
import { getCodeByName } from '@/components/telegramLogin/tl-country-code-select';
import { useAppSafeArea } from '@/hooks/useSafeArea';

export default function TelegramLoginScreen() {
  const { top, bottom } = useAppSafeArea();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryName, setCountryName] = useState('中国');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fullPhoneNumber = `${getCodeByName(countryName)} ${phoneNumber.trim()}`;

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.sendCode(fullPhoneNumber);
      router.push({
        pathname: '/telegram_login/verify_code',
        params: {
          phoneNumber: fullPhoneNumber,
          phoneCodeHash: result.phoneCodeHash,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
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
                输入你的手机号以连接 Telegram
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            <PhoneStep
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              countryName={countryName}
              onCountryChange={setCountryName}
              onSendCode={handleSendCode}
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
