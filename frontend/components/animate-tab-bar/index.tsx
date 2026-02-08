import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import TabButton from './animate-tab-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { INDICATOR_MARGIN_H, INDICATOR_MARGIN_V, TAB_BAR_HEIGHT } from '@/constants';

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
  
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
  
      const SPRING_DURATION = 300;
      const HALF = SPRING_DURATION / 2;

      isInitial
        ? translateX.setValue(targetX)
        : Animated.parallel([
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
    }, [state.index, barWidth]);
    const indicatorWidth = tabWidth - INDICATOR_MARGIN_H * 2;
  
    return (
      <View
        style={[
          styles.tabBar,
          {
            bottom: insets.bottom,
            backgroundColor: isDark
              ? 'rgba(28,28,30,0.95)'
              : 'rgba(250,250,250,0.98)',
          },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: indicatorWidth,
                transform: [{ translateX }, { scale: indicatorScale }],
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
                ...(Platform.OS === 'ios' && {
                  shadowColor: colors.tint,
                  shadowOpacity: isDark ? 0.5 : 0.3,
                }),
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? colors.text : colors.tabIconDefault;
  
          const onPress = () => {
            (process.env.EXPO_OS === 'ios') &&
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
  
            (!isFocused && !event.defaultPrevented) &&
              navigation.navigate(route.name)
          };
  
          return (
            <TabButton
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
    tabBar: {
      height: TAB_BAR_HEIGHT,
      borderRadius: 50,
      borderTopWidth: 0,
      width: '70%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'visible',
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
    indicator: {
      position: 'absolute',
      borderRadius: 50,
      top: INDICATOR_MARGIN_V,
      bottom: INDICATOR_MARGIN_V,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
        },
        android: { elevation: 6 },
      }),
    },
  });