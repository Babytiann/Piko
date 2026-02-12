import { ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';

interface TwoFAStepProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onCheckPassword: () => void;
  loading: boolean;
}

export default function TwoFAStep({
  password,
  onPasswordChange,
  onCheckPassword,
  loading,
}: TwoFAStepProps) {
  return (
    <YStack gap="$3">
      <TextInput
        className="h-12 rounded-xl bg-gray-500/10 px-4 text-base"
        placeholder="两步验证密码"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
      />
      <TouchableOpacity
        className={`h-12 rounded-xl bg-black justify-center items-center ${loading ? 'opacity-60' : ''}`}
        onPress={onCheckPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="black" fontWeight="600" fontSize="$4">
            确认密码
          </Text>
        )}
      </TouchableOpacity>
    </YStack>
  );
}
