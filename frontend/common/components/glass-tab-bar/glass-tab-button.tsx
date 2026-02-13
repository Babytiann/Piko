import React, { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
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
}: Props): ReactNode {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback((): void => {
    Animated.spring(scale, {
      toValue: 0.9,
      damping: 15,
      stiffness: 300,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const onPressOut = useCallback((): void => {
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
      style={styles.button}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
        <Text style={[styles.label, { color }]}>
          {options.title ?? route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
