import { TouchableOpacity } from 'react-native';
import { Text } from 'tamagui';

interface TelegramUnboundProps {
  prompt: string;
  buttonText: string;
  onBind: () => void;
}

export default function TelegramUnbound({
  prompt,
  buttonText,
  onBind,
}: TelegramUnboundProps) {
  return (
    <>
      <Text fontSize="$2" color="$gray11">
        {prompt}
      </Text>
      <TouchableOpacity
        className="h-12 rounded-xl bg-black justify-center items-center"
        onPress={onBind}
        activeOpacity={0.8}
      >
        <Text color="white" fontWeight="600" fontSize="$3">
          {buttonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}
