import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

const ACTION_SIZE = 44;
const ACTION_BG_LIGHT = '#1C1C1E';
const ACTION_BG_DARK = '#3A3A3C';
const ACTION_ICON_COLOR = '#FFFFFF';

interface Props {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  /** Whether this tab renders as a filled circle action button. */
  isActionButton?: boolean;
  options: BottomTabBarProps['descriptors'][string]['options'];
  color: string;
  onPress: () => void;
}

export default function GlassTabButton({
  route,
  isFocused,
  isActionButton = false,
  options,
  color,
  onPress,
}: Props): ReactNode {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn(): void {
    Animated.spring(scale, {
      toValue: isActionButton ? 0.85 : 0.9,
      damping: 15,
      stiffness: 300,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut(): void {
    Animated.spring(scale, {
      toValue: 1,
      damping: 14,
      stiffness: 280,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }

  if (isActionButton) {
    const bg = isDark ? ACTION_BG_DARK : ACTION_BG_LIGHT;

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel="记账"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <View
            style={[
              styles.actionCircle,
              {
                backgroundColor: bg,
                ...Platform.select({
                  ios: {
                    shadowColor: bg,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                  },
                  android: { elevation: 4 },
                }),
              },
            ]}
          >
            {options.tabBarIcon?.({
              focused: isFocused,
              color: ACTION_ICON_COLOR,
              size: 22,
            })}
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
  actionCircle: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
