import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
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
      <YStack
        height={48}
        bg="$gray12"
        opacity={loading ? 0.6 : 1}
        pressStyle={loading ? undefined : { opacity: 0.8 }}
        onPress={loading ? undefined : onSignIn}
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
            {verifyButtonText}
          </Text>
        )}
      </YStack>
      <YStack
        py="$2"
        pressStyle={{ opacity: 0.6 }}
        onPress={onBack}
        style={{ alignItems: 'center' }}
      >
        <Text color="$gray11" fontSize="$2">
          {backLinkText}
        </Text>
      </YStack>
    </YStack>
  );
}
