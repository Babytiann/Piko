import React, { useState, useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Modal,
  View,
  Pressable,
  type LayoutRectangle,
} from 'react-native';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import { Text } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassBackground } from './tl-glass-background';

const countries = [
  { name: '中国', code: '+86' },
  { name: '中国香港', code: '+852' },
  { name: '中国澳门', code: '+853' },
  { name: '中国台湾', code: '+886' },
  { name: '美国', code: '+1' },
  { name: '英国', code: '+44' },
  { name: '日本', code: '+81' },
  { name: '韩国', code: '+82' },
  { name: '新加坡', code: '+65' },
  { name: '马来西亚', code: '+60' },
  { name: '泰国', code: '+66' },
  { name: '印度', code: '+91' },
  { name: '澳大利亚', code: '+61' },
  { name: '加拿大', code: '+1' },
  { name: '德国', code: '+49' },
  { name: '法国', code: '+33' },
  { name: '意大利', code: '+39' },
  { name: '俄罗斯', code: '+7' },
  { name: '巴西', code: '+55' },
  { name: '印度尼西亚', code: '+62' },
  { name: '菲律宾', code: '+63' },
  { name: '越南', code: '+84' },
  { name: '阿联酋', code: '+971' },
  { name: '新西兰', code: '+64' },
  { name: '荷兰', code: '+31' },
  { name: '西班牙', code: '+34' },
  { name: '葡萄牙', code: '+351' },
  { name: '土耳其', code: '+90' },
  { name: '沙特阿拉伯', code: '+966' },
  { name: '埃及', code: '+20' },
] as const;

function getCodeByName(name: string): string {
  return countries.find((c) => c.name === name)?.code ?? '+86';
}

interface CountryCodeSelectProps {
  value: string;
  onValueChange: (name: string) => void;
}

const DROPDOWN_MAX_HEIGHT = 300;
const ITEM_HEIGHT = 44;

const springConfig = {
  damping: 20,
  mass: 0.8,
  stiffness: 200,
};

export function CountryCodeSelect({
  value,
  onValueChange,
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

  const selectedCode = getCodeByName(value);

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
        <ChevronDown size={16} color={isDark ? '#999' : '#666'} />
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

        {triggerLayout && (
          <Animated.View
            style={[
              styles.dropdownPositioner,
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
                style={[
                  styles.labelRow,
                  {
                    borderBottomColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                >
                  国家/地区
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
                        styles.itemRow,
                        i < countries.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
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
  dropdownPositioner: {
    position: 'absolute',
    zIndex: 999999,
  },
  labelRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingHorizontal: 16,
  },
});

export { getCodeByName };
