import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { YStack, Text } from 'tamagui';

import type {
  ProfileCopyItem,
  ProfilePageCopy,
} from '@/common/typings/profile';

import ProfileListRow from './profile-list-row';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const SETTINGS_ICONS: IoniconsName[] = [
  'notifications-outline',
  'shield-checkmark-outline',
  'person-outline',
];

const HELP_ICONS: IoniconsName[] = ['help-circle-outline', 'mail-outline'];

interface ProfileSettingsSectionProps {
  copy: ProfilePageCopy;
}

function SectionBlock({
  title,
  items,
  icons,
}: {
  title: string;
  items: ProfileCopyItem[];
  icons: IoniconsName[];
}): ReactNode {
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
        {title}
      </Text>
      <YStack bg="#FFFFFF" style={{ borderRadius: 16 }} pl="$4" pr="$2">
        {items.map((item, i) => (
          <ProfileListRow
            key={item.title}
            icon={icons[i] ?? 'ellipse-outline'}
            title={item.title}
            description={item.description}
          />
        ))}
      </YStack>
    </YStack>
  );
}

export default function ProfileSettingsSection({
  copy,
}: ProfileSettingsSectionProps): ReactNode {
  return (
    <YStack gap="$4">
      <SectionBlock
        title={copy.settings.title}
        items={copy.settings.items}
        icons={SETTINGS_ICONS}
      />
      <SectionBlock
        title={copy.help.title}
        items={copy.help.items}
        icons={HELP_ICONS}
      />
    </YStack>
  );
}
