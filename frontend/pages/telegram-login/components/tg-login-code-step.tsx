import type { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { YStack, Text, Input } from 'tamagui';

interface TgLoginCodeStepProps {
  phoneNumber: string;
  phoneCode: string;
  onPhoneCodeChange: (value: string) => void;
  onSignIn: () => void;
  onBack: () => void;
  loading: boolean;
  codeSentLabel: string;
  codePlaceholder: string;
  verifyButtonText: string;
  backLinkText: string;
}

export default function TgLoginCodeStep({
  phoneNumber,
  phoneCode,
  onPhoneCodeChange,
  onSignIn,
  onBack,
  loading,
  codeSentLabel,
  codePlaceholder,
  verifyButtonText,
  backLinkText,
}: TgLoginCodeStepProps): ReactNode {
  const sentText = codeSentLabel.replace('{phoneNumber}', phoneNumber);

  return (
    <YStack gap="$3">
      <Text fontSize="$2" color="$gray11">
        {sentText}
      </Text>
      <Input
        height={48}
        fontSize={16}
        placeholder={codePlaceholder}
        value={phoneCode}
        onChangeText={onPhoneCodeChange}
        keyboardType="number-pad"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSignIn}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="white" fontWeight="600" fontSize="$4">
            {verifyButtonText}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={styles.backLink}>
        <Text color="$gray11" fontSize="$2">
          {backLinkText}
        </Text>
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
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
