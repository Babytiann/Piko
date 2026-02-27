import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { XStack, YStack, Text } from 'tamagui';

import { MUTED } from '@/common/consts/theme';

interface ProfileListRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

export default function ProfileListRow({
  icon,
  title,
  description,
  right,
  onPress,
  isLast = false,
}: ProfileListRowProps): ReactNode {
  const content = (
    <XStack
      gap="$3"
      py="$3"
      style={{
        minHeight: 56,
        alignItems: 'center',
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: '#F0F0F0',
      }}
      {...(onPress && {
        pressStyle: { opacity: 0.8 },
        onPress: () => onPress(),
      })}
    >
      <Ionicons name={icon} size={22} color={MUTED} />
      <YStack flex={1} gap="$0.5">
        <Text fontSize="$4" fontWeight="600" color="$color">
          {title}
        </Text>
        {description ? (
          <Text fontSize="$2" color="$gray12">
            {description}
          </Text>
        ) : null}
      </YStack>
      {right ?? <Ionicons name="chevron-forward" size={20} color={MUTED} />}
    </XStack>
  );

  return content;
}
