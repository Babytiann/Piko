import type { ReactNode } from 'react';

import { YStack, Text } from 'tamagui';

import type { WelcomeCard } from '@/common/typings/home';

interface Props {
  data: WelcomeCard;
}

export default function HomeWelcomeCard({ data }: Props): ReactNode {
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
