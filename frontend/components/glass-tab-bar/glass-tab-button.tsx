import React, { useCallback, useRef } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

interface GlassTabButtonProps {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  options: BottomTabBarProps['descriptors'][string]['options'];
  color: string;
  onPress: () => void;
}

/** Individual tab button with press-scale animation. */
export default function GlassTabButton({
  route,
  isFocused,
  options,
  color,
  onPress,
}: GlassTabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.9,
      damping: 15,
      stiffness: 300,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 14,
      stiffness: 280,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
        {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
        <Text style={[styles.tabLabel, { color }]}>
          {options.title ?? route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
