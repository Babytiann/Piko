import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { XStack, YStack, Text, useTheme } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';

import type {
  ProfilePageLabels,
  TelegramSection as TelegramSectionData,
} from '@/common/typings/profile';

interface ProfileTelegramSectionProps {
  labels: ProfilePageLabels['linked_account'];
  data: TelegramSectionData;
  onPress: () => void;
}

export default function ProfileTelegramSection({
  labels,
  data,
  onPress,
}: ProfileTelegramSectionProps): ReactNode {
  const theme = useTheme();
  const isBound = data.is_logged_in && !!data.user;

  return (
    <YStack gap="$0">
      <Text
        fontSize="$2"
        fontWeight="600"
        color="$gray12"
        px="$4"
        py="$2"
        textTransform="uppercase"
      >
        {labels.title}
      </Text>
      <PikoCard onPress={onPress} padding="$4">
        <XStack
          gap="$3"
          py="$3"
          style={{ minHeight: 56, alignItems: 'center' }}
        >
          <Ionicons
            name="paper-plane-outline"
            size={22}
            color={theme.muted.val}
          />
          <YStack flex={1} gap="$0.5">
            <XStack gap="$2" style={{ alignItems: 'center' }}>
              <Text fontSize="$4" fontWeight="600" color="$color">
                Telegram
              </Text>
              {isBound ? (
                <>
                  <Text fontSize="$3" color="$success">
                    {labels.bound_label}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.success.val}
                  />
                </>
              ) : null}
            </XStack>
            <Text fontSize="$2" color="$gray12">
              {isBound ? labels.bound_hint : labels.unbound_hint}
            </Text>
          </YStack>
          <Ionicons name="chevron-forward" size={20} color={theme.muted.val} />
        </XStack>
      </PikoCard>
    </YStack>
  );
}
