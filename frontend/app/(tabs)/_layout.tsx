import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TAB_BAR_HEIGHT, TAB_BAR_HORIZONTAL_MARGIN, TAB_BAR_BOTTOM_GAP } from '@/constants';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const bottom = TAB_BAR_BOTTOM_GAP + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          left: TAB_BAR_HORIZONTAL_MARGIN,
          right: TAB_BAR_HORIZONTAL_MARGIN,
          bottom,
          height: TAB_BAR_HEIGHT+TAB_BAR_BOTTOM_GAP,
          borderRadius: 28,
          backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(250,250,250,0.98)',
          borderTopWidth: 0,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="sparkles" color={color} />,
        }}
      />
    </Tabs>
  );
}
