import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Colors } from '@/common/consts/theme';
import {
  INDICATOR_MARGIN_H,
  INDICATOR_MARGIN_V,
  TAB_BAR_HEIGHT,
} from '@/common/consts';
import GlassTabButton from './glass-tab-button';
import GlassOverlay from './glass-overlay';

export default function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactNode {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const hasGlass = isLiquidGlassAvailable();

  const [barWidth, setBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const prevBarWidth = useRef(0);

  const tabCount = state.routes.length;
  const tabWidth = barWidth > 0 ? barWidth / tabCount : 0;
  const targetX = state.index * tabWidth + INDICATOR_MARGIN_H;

  useEffect(() => {
    if (barWidth <= 0) return;

    const isInitial = prevBarWidth.current === 0;
    prevBarWidth.current = barWidth;

    if (isInitial) {
      translateX.setValue(targetX);
      return;
    }

    const SPRING_DURATION = 300;
    const HALF = SPRING_DURATION / 2;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 20,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 1.15,
          duration: HALF,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(indicatorScale, {
          toValue: 1,
          duration: HALF,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, barWidth, targetX, translateX, indicatorScale]);

  const indicatorWidth = tabWidth - INDICATOR_MARGIN_H * 2;

  const barBg = isDark ? 'rgba(28,28,30,0.95)' : 'rgba(250,250,250,0.98)';
  const indicatorBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View
      style={[
        styles.bar,
        {
          height: TAB_BAR_HEIGHT,
          bottom: insets.bottom,
          backgroundColor: hasGlass ? 'transparent' : barBg,
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
      ]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {hasGlass ? <GlassOverlay /> : null}

      {barWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              top: INDICATOR_MARGIN_V,
              bottom: INDICATOR_MARGIN_V,
              width: indicatorWidth,
              transform: [{ translateX }, { scale: indicatorScale }],
              backgroundColor: hasGlass
                ? isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.55)'
                : indicatorBg,
              ...Platform.select({
                ios: {
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 12,
                  ...(!hasGlass && {
                    shadowColor: colors.tint,
                    shadowOpacity: isDark ? 0.5 : 0.3,
                  }),
                },
                android: { elevation: 6 },
              }),
            },
          ]}
        >
          {hasGlass ? (
            <GlassOverlay
              tintColor={
                isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'
              }
            />
          ) : null}
        </Animated.View>
      ) : null}

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? colors.text : colors.tabIconDefault;

        const onPress = (): void => {
          if (Platform.OS === 'ios') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <GlassTabButton
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            color={color}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    width: '70%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 50,
    borderTopWidth: 0,
  },
  indicator: {
    position: 'absolute',
    borderRadius: 50,
    overflow: 'hidden',
  },
});
