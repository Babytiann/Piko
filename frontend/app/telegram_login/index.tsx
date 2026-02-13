import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, Text, Spacer } from 'tamagui';
import * as telegramApi from '@/services/telegram';
import { TelegramLoginStep } from '@/types/telegram-login';
import { getCodeByName } from '@/components/telegramLogin/tl-country-code-select';

import PhoneStep from '@/components/telegramLogin/tl-phone-step';
import { useAppSafeArea } from '@/hooks/useSafeArea';
import usePageData from '@/hooks/usePageData';

export default function TelegramLoginScreen() {
  const { top, bottom } = useAppSafeArea();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryName, setCountryName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: text } = usePageData(
    () => telegramApi.fetchTelegramText(TelegramLoginStep.PHONE),
    [],
  );

  // Set default country once text data arrives
  useEffect(() => {
    if (text) setCountryName(text.defaultCountry);
  }, [text]);

  const fullPhoneNumber = text
    ? `${getCodeByName(text.countries, countryName)} ${phoneNumber.trim()}`
    : '';

  const handleSendCode = async () => {
    if (!text) return;
    if (!phoneNumber.trim()) {
      setError(text.errors.emptyPhone);
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
      setError(err instanceof Error ? err.message : text.errors.sendCodeFail);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while fetching text
  if (!text) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
                {text.title}
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                {text.subtitle}
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
              phonePlaceholder={text.phonePlaceholder}
              sendCodeButtonText={text.sendCodeButton}
              countries={text.countries}
              countryPickerHeader={text.countryPickerHeader}
            />

            <Spacer flex={1} />
          </YStack>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
