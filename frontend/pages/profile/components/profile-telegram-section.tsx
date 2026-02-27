import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { XStack, YStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';

import type {
  ProfilePageCopy,
  TelegramSection as TelegramSectionData,
} from '@/common/typings/profile';

interface ProfileTelegramSectionProps {
  copy: ProfilePageCopy['linked_account'];
  data: TelegramSectionData;
  onPress: () => void;
}

export default function ProfileTelegramSection({
  copy,
  data,
  onPress,
}: ProfileTelegramSectionProps): ReactNode {
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
        {copy.title}
      </Text>
      <PikoCard onPress={onPress} padding="$4">
        <XStack
          gap="$3"
          py="$3"
          style={{ minHeight: 56, alignItems: 'center' }}
        >
          <Ionicons name="paper-plane-outline" size={22} color="#8E8E93" />
          <YStack flex={1} gap="$0.5">
            <XStack gap="$2" style={{ alignItems: 'center' }}>
              <Text fontSize="$4" fontWeight="600" color="$color">
                Telegram
              </Text>
              {isBound ? (
                <>
                  <Text fontSize="$3" color="$green10">
                    {copy.bound_label}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                </>
              ) : null}
            </XStack>
            <Text fontSize="$2" color="$gray12">
              {isBound ? copy.bound_hint : copy.unbound_hint}
            </Text>
          </YStack>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </XStack>
      </PikoCard>
    </YStack>
  );
}
