import { ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { YStack, Text } from 'tamagui';

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
        className="h-12 rounded-xl bg-gray-500/10 px-4 text-base"
        placeholder="输入验证码"
        value={phoneCode}
        onChangeText={onPhoneCodeChange}
        keyboardType="number-pad"
      />
      <TouchableOpacity
        className={`h-12 rounded-xl bg-black justify-center items-center ${loading ? 'opacity-60' : ''}`}
        onPress={onSignIn}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text color="white" fontWeight="600" fontSize="$4">
            验证登录
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} className="items-center py-2">
        <Text color="$gray11" fontSize="$2">
          返回修改手机号
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
