import type { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { YStack, Text, XStack, Input } from 'tamagui';

import type { CountryItem } from '@/common/typings/telegram-login';

import TgLoginCountrySelect from './tg-login-country-select';

interface TgLoginPhoneStepProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  countryName: string;
  onCountryChange: (name: string) => void;
  onSendCode: () => void;
  loading: boolean;
  phonePlaceholder: string;
  sendCodeButtonText: string;
  countries: CountryItem[];
  countryPickerHeader: string;
}

export default function TgLoginPhoneStep({
  phoneNumber,
  onPhoneNumberChange,
  countryName,
  onCountryChange,
  onSendCode,
  loading,
  phonePlaceholder,
  sendCodeButtonText,
  countries,
  countryPickerHeader,
}: TgLoginPhoneStepProps): ReactNode {
  return (
    <YStack gap="$3">
      <XStack gap="$2" style={{ alignItems: 'center' }}>
        <TgLoginCountrySelect
          value={countryName}
          onValueChange={onCountryChange}
          countries={countries}
          header={countryPickerHeader}
        />
        <Input
          flex={1}
          size="$4"
          placeholder={phonePlaceholder}
          value={phoneNumber}
          onChangeText={onPhoneNumberChange}
          keyboardType="default"
        />
      </XStack>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSendCode}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="white" fontWeight="600" fontSize="$4">
            {sendCodeButtonText}
          </Text>
        )}
      </TouchableOpacity>
    </YStack>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
