import type { ReactNode } from 'react';
import { useState, useRef } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Modal,
  View,
  Pressable,
  StyleSheet,
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

import { DROPDOWN_MAX_HEIGHT } from '@/common/consts';
import type { CountryItem } from '@/common/typings/telegram-login';

import { SPRING_CONFIG } from '../consts';
import { getCodeByName } from '../utils/getCodeByName';
import { TgLoginGlassBackground } from './tg-login-glass-background';

interface TgLoginCountrySelectProps {
  value: string;
  onValueChange: (name: string) => void;
  countries: CountryItem[];
  header: string;
}

export default function TgLoginCountrySelect({
  value,
  onValueChange,
  countries,
  header,
}: TgLoginCountrySelectProps): ReactNode {
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

  const openDropdown = (): void => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
      opacity.value = withSpring(1, SPRING_CONFIG);
      scale.value = withSpring(1, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
    });
  };

  const closeDropdown = (): void => {
    opacity.value = withTiming(0, { duration: 180 });
    scale.value = withTiming(0.95, { duration: 180 });
    translateY.value = withTiming(-6, { duration: 180 });
    setTimeout(() => setOpen(false), 200);
  };

  const handleSelect = (name: string): void => {
    onValueChange(name);
    closeDropdown();
  };

  const selectedCode = getCodeByName(countries, value);

  return (
    <View ref={triggerRef} collapsable={false}>
      <TouchableOpacity
        onPress={openDropdown}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Text fontSize={15} fontWeight="500" color="$color">
          {selectedCode}
        </Text>
        <ChevronDown size={16} color={isDark ? '#9BA1A6' : '#687076'} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDropdown}>
          <View style={StyleSheet.absoluteFill} />
        </Pressable>

        {triggerLayout ? (
          <Animated.View
            style={[
              styles.dropdown,
              {
                top: triggerLayout.y + triggerLayout.height + 6,
                left: triggerLayout.x,
                minWidth: Math.max(triggerLayout.width, 200),
              },
              animatedDropdownStyle,
            ]}
          >
            <TgLoginGlassBackground isDark={isDark}>
              <View
                style={[
                  styles.dropdownHeader,
                  {
                    borderBottomColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text fontSize={13} fontWeight="600" color="$muted">
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
                      style={[
                        styles.optionRow,
                        i < countries.length - 1 && {
                          borderBottomWidth: 0.5,
                          borderBottomColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.06)',
                        },
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.12)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <Text
                        fontSize={15}
                        color={isSelected ? '$primary' : '$color'}
                        fontWeight={isSelected ? '600' : '400'}
                        flex={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        fontSize={14}
                        color="$muted"
                        mr={isSelected ? 8 : 0}
                      >
                        {item.code}
                      </Text>
                      {isSelected ? (
                        <Check
                          size={16}
                          color={isDark ? '#ECEDEE' : '#11181C'}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </TgLoginGlassBackground>
          </Animated.View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
    width: 90,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdown: {
    position: 'absolute',
    zIndex: 999999,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
  },
});
