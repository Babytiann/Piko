import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
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

import { Colors } from '@/constants/theme';
import {
  INDICATOR_MARGIN_H,
  INDICATOR_MARGIN_V,
  TAB_BAR_HEIGHT,
} from '@/constants';
import GlassTabButton from './glass-tab-button';
import GlassOverlay from './galss-overlay';

export default function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
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
      className="absolute w-[70%] self-center flex-row items-center overflow-hidden rounded-[50px] border-t-0"
      style={{
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
      }}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {hasGlass && <GlassOverlay />}

      {barWidth > 0 && (
        <Animated.View
          className="absolute rounded-[50px] overflow-hidden"
          style={{
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
          }}
        >
          {hasGlass && (
            <GlassOverlay
              tintColor={
                isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'
              }
            />
          )}
        </Animated.View>
      )}

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? colors.text : colors.tabIconDefault;

        const onPress = () => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
