import type { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
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
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onCheckPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="white" fontWeight="600" fontSize="$4">
            {confirmButtonText}
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
