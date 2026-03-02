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
];

const HELP_ICONS: IoniconsName[] = ['help-circle-outline', 'mail-outline'];

export type ProfileSettingsSectionKey = 'settings' | 'help';

interface ProfileSettingsSectionProps {
  labels: ProfilePageLabels;
  onPressItem?: (index: number, section: ProfileSettingsSectionKey) => void;
}

function SectionBlock({
  title,
  items,
  icons,
  section,
  onPressItem,
}: {
  title: string;
  items: ProfileLabelItem[];
  icons: IoniconsName[];
  section: ProfileSettingsSectionKey;
  onPressItem?: (index: number, section: ProfileSettingsSectionKey) => void;
}): ReactNode {
  return (
    <PikoCard padding="$4">
      <YStack gap="$0">
        <Text fontSize="$2" fontWeight="600" color="$gray12" pb="$2">
          {title}
        </Text>
        {items.map((item, i) => (
          <ProfileListRow
            key={item.title}
            icon={icons[i] ?? 'ellipse-outline'}
            title={item.title}
            description={item.description}
            isLast={i === items.length - 1}
            onPress={onPressItem ? () => onPressItem(i, section) : undefined}
          />
        ))}
      </YStack>
    </PikoCard>
  );
}

export default function ProfileSettingsSection({
  labels,
  onPressItem,
}: ProfileSettingsSectionProps): ReactNode {
  return (
    <YStack gap="$4">
      <SectionBlock
        title={labels.settings?.title ?? ''}
        items={labels.settings?.items ?? []}
        icons={SETTINGS_ICONS}
        section="settings"
        onPressItem={onPressItem}
      />
      <SectionBlock
        title={labels.help?.title ?? ''}
        items={labels.help?.items ?? []}
        icons={HELP_ICONS}
        section="help"
        onPressItem={onPressItem}
      />
    </YStack>
  );
}
