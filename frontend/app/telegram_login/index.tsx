import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import * as telegramApi from '@/service/telegram';
import { TelegramLoginStep } from '@/common/typings/telegram-login';
import type { PhoneStepText } from '@/common/typings/telegram-login';

import { getCodeByName } from '@/pages/telegram-login/utils/getCodeByName';
import TgLoginFormLayout from '@/pages/telegram-login/components/tg-login-form-layout';
import TgLoginPhoneStep from '@/pages/telegram-login/components/tg-login-phone-step';

export default function TelegramLoginScreen(): ReactNode {
  const router = useRouter();

  const [text, setText] = useState<PhoneStepText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryName, setCountryName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const data = await telegramApi.fetchTelegramText(TelegramLoginStep.PHONE);
      if (cancelled) return;
      setText(data);
      setCountryName(data.defaultCountry);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fullPhoneNumber = text
    ? `${getCodeByName(text.countries, countryName)} ${phoneNumber.trim()}`
    : '';

  const handleSendCode = async (): Promise<void> => {
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

  if (!text) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const { phonePlaceholder, sendCodeButton, countries, countryPickerHeader } =
    text;

  return (
    <TgLoginFormLayout
      title={text.title}
      subtitle={text.subtitle}
      error={error}
    >
      <TgLoginPhoneStep
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        countryName={countryName}
        onCountryChange={setCountryName}
        onSendCode={() => void handleSendCode()}
        loading={loading}
        phonePlaceholder={phonePlaceholder}
        sendCodeButtonText={sendCodeButton}
        countries={countries}
        countryPickerHeader={countryPickerHeader}
      />
    </TgLoginFormLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
