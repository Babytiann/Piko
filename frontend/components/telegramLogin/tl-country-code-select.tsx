import React, { useState, useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Modal,
  View,
  Pressable,
  type LayoutRectangle,
} from 'react-native';
import { Text } from 'tamagui';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassBackground } from './tl-glass-background';
import { DROPDOWN_MAX_HEIGHT } from '@/constants';
import type { CountryItem } from '@/types/telegram-login';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Resolve a country name to its dial code from the given list. */
export function getCodeByName(countries: CountryItem[], name: string): string {
  return countries.find((c) => c.name === name)?.code ?? '+86';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CountryCodeSelectProps {
  value: string;
  onValueChange: (name: string) => void;
  /** Country list from server */
  countries: CountryItem[];
  /** Dropdown header text from server */
  header: string;
}

const springConfig = {
  damping: 20,
  mass: 0.8,
  stiffness: 200,
};

export default function CountryCodeSelect({
  value,
  onValueChange,
  countries,
  header,
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(
    null,
  );

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(-8);

  const animatedDropdownStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const openDropdown = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
      opacity.value = withSpring(1, springConfig);
      scale.value = withSpring(1, springConfig);
      translateY.value = withSpring(0, springConfig);
    });
  }, [opacity, scale, translateY]);

  const closeDropdown = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180 });
    scale.value = withTiming(0.95, { duration: 180 });
    translateY.value = withTiming(-6, { duration: 180 });
    setTimeout(() => {
      setOpen(false);
    }, 200);
  }, [opacity, scale, translateY]);

  const handleSelect = useCallback(
    (name: string) => {
      onValueChange(name);
      closeDropdown();
    },
    [onValueChange, closeDropdown],
  );

  const selectedCode = getCodeByName(countries, value);

  return (
    <View ref={triggerRef} collapsable={false}>
      <TouchableOpacity
        onPress={openDropdown}
        activeOpacity={0.7}
        className="flex-row items-center justify-center gap-1 h-11 w-[90px] rounded-xl border"
        style={{
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Text fontSize={15} fontWeight="500" color="$color">
          {selectedCode}
        </Text>
        <ChevronDown size={16} color={isDark ? '#999' : '#666'} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable className="absolute inset-0" onPress={closeDropdown}>
          <View className="absolute inset-0" />
        </Pressable>

        {triggerLayout && (
          <Animated.View
            className="absolute z-[999999]"
            style={[
              {
                top: triggerLayout.y + triggerLayout.height + 6,
                left: triggerLayout.x,
                minWidth: Math.max(triggerLayout.width, 200),
              },
              animatedDropdownStyle,
            ]}
          >
            <GlassBackground isDark={isDark}>
              <View
                className="px-4 py-2.5 border-b-[0.5px]"
                style={{
                  borderBottomColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                }}
              >
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                >
                  {header}
                </Text>
              </View>

              <ScrollView
                style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                showsVerticalScrollIndicator={false}
                bounces
              >
                {countries.map((item, i) => {
                  const isSelected = item.name === value;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      onPress={() => handleSelect(item.name)}
                      activeOpacity={0.6}
                      className="flex-row items-center h-11 px-4"
                      style={[
                        i < countries.length - 1 && {
                          borderBottomWidth: 0.5,
                          borderBottomColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.06)',
                        },
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(10,132,255,0.15)'
                            : 'rgba(0,122,255,0.08)',
                        },
                      ]}
                    >
                      <Text
                        fontSize={15}
                        color={isSelected ? '#007AFF' : '$color'}
                        fontWeight={isSelected ? '600' : '400'}
                        flex={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        fontSize={14}
                        color={isDark ? '#8E8E93' : '#8E8E93'}
                        mr={isSelected ? 8 : 0}
                      >
                        {item.code}
                      </Text>
                      {isSelected && <Check size={16} color="#007AFF" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </GlassBackground>
          </Animated.View>
        )}
      </Modal>
    </View>
  );
}
