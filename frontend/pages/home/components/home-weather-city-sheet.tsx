import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  Dimensions,
  useColorScheme,
  Linking,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text } from 'tamagui';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';
import type { WeatherCityOption } from '@/common/typings/home';
import { fetchReverseGeocode } from '@/services/home';
import { updateProfile } from '@/services/profile';
import useLocation from '@/pages/ai-chat/hooks/useLocation';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT_RATIO = 0.7;
const PICKER_HEIGHT = 216;

interface WeatherCityPickerLabels {
  title: string;
  auto_locate_label: string;
  auto_locate_denied_hint: string;
  confirm_label: string;
  saving_label: string;
  locating_label: string;
  locate_click_hint: string;
  province_label: string;
  city_label: string;
  empty_options_hint?: string;
  located_success_hint?: string;
  locate_failed_hint?: string;
  geocode_failed_hint?: string;
}

interface Props {
  visible: boolean;
  currentCity?: string;
  onClose: () => void;
  onSaved: () => void;
  weatherCityOptions: WeatherCityOption[];
  labels: WeatherCityPickerLabels;
}

const DISTRICT_TO_CITY: Record<string, string> = {
  海淀区: '北京',
  朝阳区: '北京',
  西城区: '北京',
  东城区: '北京',
  丰台区: '北京',
  石景山区: '北京',
  通州区: '北京',
  顺义区: '北京',
  昌平区: '北京',
  大兴区: '北京',
  怀柔区: '北京',
  平谷区: '北京',
  密云区: '北京',
  延庆区: '北京',
  西湖区: '杭州',
  滨江区: '杭州',
  上城区: '杭州',
  拱墅区: '杭州',
  余杭区: '杭州',
  萧山区: '杭州',
  临安区: '杭州',
  浦东新区: '上海',
  徐汇区: '上海',
  黄浦区: '上海',
  静安区: '上海',
  天河区: '广州',
  越秀区: '广州',
  海珠区: '广州',
  荔湾区: '广州',
  南山区: '深圳',
  福田区: '深圳',
  罗湖区: '深圳',
  宝安区: '深圳',
  Beijing: '北京',
  Shanghai: '上海',
  Hangzhou: '杭州',
  Guangzhou: '广州',
  Shenzhen: '深圳',
  Tianjin: '天津',
  Chongqing: '重庆',
  Nanjing: '南京',
  Chengdu: '成都',
  Wuhan: '武汉',
  Suzhou: '苏州',
  "Xi'an": '西安',
  Xian: '西安',
};

function findIndicesByCity(
  cityName: string,
  options: WeatherCityOption[],
): { provinceIndex: number; cityIndex: number } {
  let normalized = cityName.trim();
  if (DISTRICT_TO_CITY[normalized]) {
    normalized = DISTRICT_TO_CITY[normalized];
  }
  for (let pi = 0; pi < options.length; pi++) {
    const prov = options[pi];
    for (let ci = 0; ci < prov.cities.length; ci++) {
      const city = prov.cities[ci];
      if (city === normalized || prov.name.replace('市', '') === normalized) {
        return { provinceIndex: pi, cityIndex: ci };
      }
    }
  }
  return { provinceIndex: 0, cityIndex: 0 };
}

function getCityDisplayName(provinceName: string, cityName: string): string {
  if (
    provinceName === '北京市' ||
    provinceName === '上海市' ||
    provinceName === '天津市' ||
    provinceName === '重庆市'
  ) {
    return provinceName.replace('市', '');
  }
  return cityName;
}

export default function HomeWeatherCitySheet({
  visible,
  currentCity,
  onClose,
  onSaved,
  weatherCityOptions,
  labels,
}: Props): ReactNode {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const colors = getThemeColors(scheme);
  const insets = useSafeAreaInsets();
  const { getLocation, wasDenied, requestPermissionAgain } = useLocation();
  const sheetMaxHeight = SCREEN_H * SHEET_MAX_HEIGHT_RATIO;
  const contentPaddingBottom = Math.max(40, insets.bottom + 16);

  const [selectedProvinceIndex, setSelectedProvinceIndex] = useState(0);
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatedCityName, setLocatedCityName] = useState<string | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const translateY = useSharedValue(SCREEN_H);

  const options = weatherCityOptions.length > 0 ? weatherCityOptions : [];

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  useEffect(() => {
    if (visible) {
      setLocateError(null);
      setLocatedCityName(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && currentCity && options.length > 0) {
      const { provinceIndex, cityIndex } = findIndicesByCity(
        currentCity,
        options,
      );
      const pi = Math.min(provinceIndex, options.length - 1);
      setSelectedProvinceIndex(pi);
      setSelectedCityIndex(cityIndex);
      const prov = options[pi];
      const cityName = prov.cities[cityIndex];
      const displayName = getCityDisplayName(prov.name, cityName ?? '');
      setLocatedCityName(displayName);
    }
  }, [visible, currentCity, options.length]);

  useEffect(() => {
    if (options.length === 0 || selectedProvinceIndex >= options.length) return;
    const cities = options[selectedProvinceIndex].cities;
    if (selectedCityIndex >= cities.length) {
      setSelectedCityIndex(0);
    }
  }, [selectedProvinceIndex, selectedCityIndex, options]);

  const handleAutoLocate = async (): Promise<void> => {
    setLocateError(null);
    setLocatedCityName(null);
    if (wasDenied()) {
      setLocating(true);
      await requestPermissionAgain();
      setLocating(false);
      return;
    }
    setLocating(true);
    try {
      const loc = await getLocation();
      if (!loc) {
        setLocateError(
          labels.locate_failed_hint ?? '定位失败，请检查权限或网络',
        );
        setLocating(false);
        return;
      }
      const res = await fetchReverseGeocode(loc.latitude, loc.longitude);
      if (!res?.success || !res.data?.city) {
        setLocateError(
          labels.geocode_failed_hint ?? '无法识别当前位置，请手动选择城市',
        );
        setLocating(false);
        return;
      }
      if (options.length > 0) {
        const { provinceIndex, cityIndex } = findIndicesByCity(
          res.data.city,
          options,
        );
        setSelectedProvinceIndex(provinceIndex);
        setSelectedCityIndex(cityIndex);
        const prov = options[provinceIndex];
        const cityName = prov.cities[cityIndex];
        const displayName = getCityDisplayName(prov.name, cityName ?? '');
        setLocatedCityName(displayName);
      }
      setLocateError(null);
    } catch {
      setLocateError(labels.locate_failed_hint ?? '定位失败，请检查权限或网络');
    } finally {
      setLocating(false);
    }
  };

  const handleOpenSettings = (): void => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Linking.openSettings();
    }
  };

  const handleConfirm = async (): Promise<void> => {
    if (options.length === 0) return;
    const prov = options[selectedProvinceIndex];
    const cityName = prov.cities[selectedCityIndex];
    const displayCity = getCityDisplayName(
      prov.name,
      cityName ?? prov.cities[0] ?? '',
    );
    setSaving(true);
    try {
      const res = await updateProfile({ weather_city: displayCity });
      if (res.success) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('[WeatherCitySheet] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const province = options[selectedProvinceIndex];
  const cities = province?.cities ?? [];

  if (!visible) return null;

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
          <Animated.View style={[sheetStyle, { maxHeight: sheetMaxHeight }]}>
            <YStack
              bg="$card"
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderCurve: 'continuous',
                padding: 24,
                paddingBottom: contentPaddingBottom,
                maxHeight: sheetMaxHeight,
              }}
            >
              <XStack
                mb="$3"
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                  }}
                />
              </XStack>
              <XStack
                mb="$4"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text fontSize={18} fontWeight="800" color="$color">
                  {labels.title}
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </XStack>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                style={{ maxHeight: sheetMaxHeight - 120 }}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <YStack
                  mb="$4"
                  py="$3"
                  px="$4"
                  bg="$gray3"
                  style={{ borderRadius: 14, borderCurve: 'continuous' }}
                >
                  <XStack style={{ alignItems: 'center', gap: 8 }}>
                    <Ionicons name="locate" size={20} color={colors.primary} />
                    <Text fontSize={14} fontWeight="600" color="$color">
                      {labels.auto_locate_label}
                    </Text>
                  </XStack>
                  {wasDenied() ? (
                    <Text
                      fontSize={12}
                      color="$primary"
                      mt="$2"
                      pressStyle={{ opacity: 0.8 }}
                      onPress={handleOpenSettings}
                    >
                      {labels.auto_locate_denied_hint}
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => void handleAutoLocate()}
                      disabled={locating}
                      style={{ marginTop: 8 }}
                    >
                      <Text
                        fontSize={12}
                        color="$primary"
                        style={{ opacity: locating ? 0.6 : 1 }}
                      >
                        {locating
                          ? labels.locating_label
                          : labels.locate_click_hint}
                      </Text>
                    </Pressable>
                  )}
                  {locatedCityName ? (
                    <Text fontSize={12} color="$success" mt="$2">
                      {(
                        labels.located_success_hint ??
                        '已定位到 {city}，请点击下方确定保存'
                      ).replace('{city}', locatedCityName)}
                    </Text>
                  ) : null}
                  {locateError ? (
                    <Text fontSize={12} color="$destructive" mt="$2">
                      {locateError}
                    </Text>
                  ) : null}
                </YStack>

                {options.length === 0 ? (
                  <YStack
                    style={{
                      minHeight: 180,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    py="$4"
                  >
                    <Text fontSize={14} color="$muted">
                      {labels.empty_options_hint ?? '暂无城市列表，请稍后重试'}
                    </Text>
                  </YStack>
                ) : (
                  <XStack style={{ minHeight: PICKER_HEIGHT + 24 }}>
                    <YStack flex={1}>
                      <Text fontSize={12} color="$muted" mb="$1">
                        {labels.province_label}
                      </Text>
                      <Picker
                        selectedValue={selectedProvinceIndex}
                        onValueChange={(value) => {
                          setSelectedProvinceIndex(value as number);
                          setSelectedCityIndex(0);
                        }}
                        style={{
                          height: PICKER_HEIGHT,
                          color: colors.primary,
                        }}
                        itemStyle={
                          Platform.OS === 'ios' ? { fontSize: 16 } : undefined
                        }
                      >
                        {options.map((p, i) => (
                          <Picker.Item key={p.name} label={p.name} value={i} />
                        ))}
                      </Picker>
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize={12} color="$muted" mb="$1">
                        {labels.city_label}
                      </Text>
                      <Picker
                        selectedValue={selectedCityIndex}
                        onValueChange={(value) =>
                          setSelectedCityIndex(value as number)
                        }
                        style={{
                          height: PICKER_HEIGHT,
                          color: colors.primary,
                        }}
                        itemStyle={
                          Platform.OS === 'ios' ? { fontSize: 16 } : undefined
                        }
                      >
                        {cities.map((c, i) => (
                          <Picker.Item key={c} label={c} value={i} />
                        ))}
                      </Picker>
                    </YStack>
                  </XStack>
                )}
              </ScrollView>

              <Pressable
                onPress={() => void handleConfirm()}
                disabled={saving || options.length === 0}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginTop: 16,
                  opacity: saving || options.length === 0 ? 0.6 : 1,
                }}
              >
                <Text fontSize={16} fontWeight="700" color="$primaryForeground">
                  {saving ? labels.saving_label : labels.confirm_label}
                </Text>
              </Pressable>
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
