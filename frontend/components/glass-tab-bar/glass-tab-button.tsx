import React, { useCallback, useRef } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable, Text } from 'react-native';

interface GlassTabButtonProps {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  options: BottomTabBarProps['descriptors'][string]['options'];
  color: string;
  onPress: () => void;
}

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
      className="flex-1 items-center justify-center h-full"
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View
        className="items-center justify-center"
        style={{ transform: [{ scale }] }}
      >
        {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
        <Text className="text-xs font-medium mt-0.5" style={{ color }}>
          {options.title ?? route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
