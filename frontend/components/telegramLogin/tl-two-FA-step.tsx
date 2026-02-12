import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { YStack, Text, Input } from 'tamagui';

interface TwoFAStepProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onCheckPassword: () => void;
  loading: boolean;
  /** Server-driven text props */
  passwordPlaceholder: string;
  confirmButtonText: string;
}

export default function TwoFAStep({
  password,
  onPasswordChange,
  onCheckPassword,
  loading,
  passwordPlaceholder,
  confirmButtonText,
}: TwoFAStepProps) {
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
        className={`h-12 rounded-xl justify-center items-center ${loading ? 'opacity-60' : ''}`}
        style={{ backgroundColor: '#333' }}
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
