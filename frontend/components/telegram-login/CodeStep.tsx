import { ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';
import { loginStyles as styles } from './styles';

interface CodeStepProps {
  phoneNumber: string;
  phoneCode: string;
  onPhoneCodeChange: (value: string) => void;
  onSignIn: () => void;
  onBack: () => void;
  loading: boolean;
}

export default function CodeStep({
  phoneNumber,
  phoneCode,
  onPhoneCodeChange,
  onSignIn,
  onBack,
  loading,
}: CodeStepProps) {
  return (
    <YStack gap="$3">
      <Text fontSize="$2" color="$gray11">
        验证码已发送至 {phoneNumber}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="输入验证码"
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
          <ActivityIndicator color="black" />
        ) : (
          <Text color="black" fontWeight="600" fontSize="$4">
            验证登录
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={styles.linkButton}>
        <Text color="$gray11" fontSize="$2">
          返回修改手机号
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
