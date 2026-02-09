import { ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import { YStack, Text } from "tamagui";
import { loginStyles as styles } from "./styles";

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
        style={styles.input}
        placeholder="两步验证密码"
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
            确认密码
          </Text>
        )}
      </TouchableOpacity>
    </YStack>
  );
}
