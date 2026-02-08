import { ActivityIndicator, TouchableOpacity } from "react-native";
import { YStack, Text, XStack, Input } from "tamagui";

import { loginStyles as styles } from "./styles";
import { CountryCodeSelect } from "./CountryCodeSelect";

interface PhoneStepProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  countryName: string;
  onCountryChange: (name: string) => void;
  onSendCode: () => void;
  loading: boolean;
}

export default function PhoneStep({
  phoneNumber,
  onPhoneNumberChange,
  countryName,
  onCountryChange,
  onSendCode,
  loading,
}: PhoneStepProps) {
  return (
    <YStack gap="$3">
      <XStack gap="$2" items="center">
        <CountryCodeSelect
          value={countryName}
          onValueChange={onCountryChange}
        />
        <Input
          flex={1}
          size="$4"
          placeholder="手机号"
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
            发送验证码
          </Text>
        )}
      </TouchableOpacity>
    </YStack>
  );
}
