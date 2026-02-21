import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import GlassTabBar from '@/common/components/glass-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai/index"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="sparkles-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
