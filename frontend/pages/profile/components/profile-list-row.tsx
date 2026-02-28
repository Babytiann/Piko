import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { XStack, YStack, Text, useTheme } from 'tamagui';

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
  const theme = useTheme();
  const content = (
    <XStack
      gap="$3"
      py="$3"
      borderBottomWidth={isLast ? 0 : 0.5}
      borderBottomColor="$gray4"
      style={{
        minHeight: 56,
        alignItems: 'center',
      }}
      {...(onPress && {
        pressStyle: { opacity: 0.8 },
        onPress: () => onPress(),
      })}
    >
      <Ionicons name={icon} size={22} color={theme.muted.val} />
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
      {right ?? (
        <Ionicons name="chevron-forward" size={20} color={theme.muted.val} />
      )}
    </XStack>
  );

  return content;
}
