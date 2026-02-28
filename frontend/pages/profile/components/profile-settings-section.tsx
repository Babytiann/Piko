import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { YStack, Text } from 'tamagui';

import { PikoCard } from '@/common/components/piko-card';

import type {
  ProfileLabelItem,
  ProfilePageLabels,
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
  labels: ProfilePageLabels;
}

function SectionBlock({
  title,
  items,
  icons,
}: {
  title: string;
  items: ProfileLabelItem[];
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
      <PikoCard padding="$4">
        {items.map((item, i) => (
          <ProfileListRow
            key={item.title}
            icon={icons[i] ?? 'ellipse-outline'}
            title={item.title}
            description={item.description}
            isLast={i === items.length - 1}
          />
        ))}
      </PikoCard>
    </YStack>
  );
}

export default function ProfileSettingsSection({
  labels,
}: ProfileSettingsSectionProps): ReactNode {
  return (
    <YStack gap="$4">
      <SectionBlock
        title={labels.settings.title}
        items={labels.settings.items}
        icons={SETTINGS_ICONS}
      />
      <SectionBlock
        title={labels.help.title}
        items={labels.help.items}
        icons={HELP_ICONS}
      />
    </YStack>
  );
}
