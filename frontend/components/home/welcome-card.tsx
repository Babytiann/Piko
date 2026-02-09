import { YStack, Text } from 'tamagui';
import type { WelcomeCard as WelcomeCardData } from '@/types/home';

interface WelcomeCardProps {
  data: WelcomeCardData;
}

export default function WelcomeCard({ data }: WelcomeCardProps) {
  return (
    <YStack>
      <Text fontSize="$7" fontWeight="600" color="$color">
        {data.title}
      </Text>
      <Text fontSize="$3" color="$gray11" mt="$2">
        {data.description}
      </Text>
    </YStack>
  );
}
