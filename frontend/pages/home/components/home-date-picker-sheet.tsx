import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Modal, Pressable, Dimensions, useColorScheme } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';
const SCREEN_H = Dimensions.get('window').height;

interface CalendarLabels {
  date_picker_title: string;
  today_label: string;
  month_names: string[];
  day_names: string[];
  day_names_short: string[];
}

interface Props {
  visible: boolean;
  currentDate: string;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
  labels?: CalendarLabels;
}

export default function HomeDatePickerSheet({
  visible,
  currentDate,
  onSelect,
  onClose,
  labels,
}: Props): ReactNode {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const colors = getThemeColors(scheme);
  const translateY = useSharedValue(SCREEN_H);

  const calLabels = useMemo(() => {
    const monthNames = labels?.month_names ?? [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ];
    const dayNames = labels?.day_names ?? [
      '周日',
      '周一',
      '周二',
      '周三',
      '周四',
      '周五',
      '周六',
    ];
    const dayNamesShort = labels?.day_names_short ?? [
      '日',
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
    ];
    return { monthNames, dayNames, dayNamesShort };
  }, [labels]);

  useMemo(() => {
    LocaleConfig.locales['zh'] = {
      monthNames: calLabels.monthNames,
      monthNamesShort: calLabels.monthNames,
      dayNames: calLabels.dayNames,
      dayNamesShort: calLabels.dayNamesShort,
      today: labels?.today_label ?? '今天',
    };
    LocaleConfig.defaultLocale = 'zh';
  }, [calLabels, labels?.today_label]);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View style={sheetStyle}>
            <YStack
              bg="$card"
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderCurve: 'continuous',
                paddingTop: 20,
                paddingBottom: 40,
              }}
            >
              <XStack
                px="$5"
                mb="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text fontSize={18} fontWeight="700" color="$color">
                  {labels?.date_picker_title ?? '选择日期'}
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </XStack>

              <Calendar
                current={currentDate}
                firstDay={1}
                markedDates={{
                  [currentDate]: {
                    selected: true,
                    selectedColor: colors.primary,
                  },
                }}
                onDayPress={(day) => onSelect(day.dateString)}
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  textSectionTitleColor: colors.muted,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.primaryForeground,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.primary,
                  textDisabledColor: scheme === 'dark' ? '#52525B' : '#D4D4D8',
                  arrowColor: colors.primary,
                  monthTextColor: colors.primary,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 15,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
                style={{ paddingHorizontal: 8 }}
              />
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
