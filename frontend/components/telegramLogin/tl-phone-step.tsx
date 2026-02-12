import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { YStack, Text, XStack, Input } from 'tamagui';

import CountryCodeSelect from './tl-country-code-select';
import type { CountryItem } from '@/types/telegram-login';

interface PhoneStepProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  countryName: string;
  onCountryChange: (name: string) => void;
  onSendCode: () => void;
  loading: boolean;
  /** Server-driven text props */
  phonePlaceholder: string;
  sendCodeButtonText: string;
  countries: CountryItem[];
  countryPickerHeader: string;
}

export default function PhoneStep({
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
}: PhoneStepProps) {
  return (
    <YStack gap="$3">
      <XStack gap="$2" items="center">
        <CountryCodeSelect
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
        className={`h-12 rounded-xl bg-black justify-center items-center ${loading ? 'opacity-60' : ''}`}
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
