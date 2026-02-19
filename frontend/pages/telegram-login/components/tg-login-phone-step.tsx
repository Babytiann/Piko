import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
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

      <YStack
        height={48}
        bg="$gray12"
        opacity={loading ? 0.6 : 1}
        pressStyle={loading ? undefined : { opacity: 0.8 }}
        onPress={loading ? undefined : onSendCode}
        style={{
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="$gray1" fontWeight="600" fontSize="$4">
            {sendCodeButtonText}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}
