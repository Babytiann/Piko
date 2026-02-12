import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { YStack, Text, Input } from 'tamagui';

interface CodeStepProps {
  phoneNumber: string;
  phoneCode: string;
  onPhoneCodeChange: (value: string) => void;
  onSignIn: () => void;
  onBack: () => void;
  loading: boolean;
  /** Server-driven text props */
  codeSentLabel: string;
  codePlaceholder: string;
  verifyButtonText: string;
  backLinkText: string;
}

export default function CodeStep({
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
}: CodeStepProps) {
  // Replace {phoneNumber} placeholder in the server-provided label
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
        className={`h-12 rounded-xl justify-center items-center ${loading ? 'opacity-60' : ''}`}
        style={{ backgroundColor: '#333' }}
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
      <TouchableOpacity onPress={onBack} className="items-center py-2">
        <Text color="$gray11" fontSize="$2">
          {backLinkText}
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
