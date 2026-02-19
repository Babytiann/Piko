import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack, Text, Input } from 'tamagui';

interface TgLoginTwoFaStepProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onCheckPassword: () => void;
  loading: boolean;
  passwordPlaceholder: string;
  confirmButtonText: string;
}

export default function TgLoginTwoFaStep({
  password,
  onPasswordChange,
  onCheckPassword,
  loading,
  passwordPlaceholder,
  confirmButtonText,
}: TgLoginTwoFaStepProps): ReactNode {
  return (
    <YStack gap="$3">
      <Input
        height={48}
        fontSize={16}
        placeholder={passwordPlaceholder}
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
      />
      <YStack
        height={48}
        bg="$gray12"
        opacity={loading ? 0.6 : 1}
        pressStyle={loading ? undefined : { opacity: 0.8 }}
        onPress={loading ? undefined : onCheckPassword}
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
            {confirmButtonText}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}
