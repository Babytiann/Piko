import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';

const SCREEN_H = Dimensions.get('window').height;

interface LoginPromptLabels {
  title: string;
  subtitle: string;
  button_text: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  labels: LoginPromptLabels;
}

export default function HomeLoginPromptSheet({
  visible,
  onClose,
  labels,
}: Props): ReactNode {
  const router = useRouter();
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const colors = getThemeColors(scheme);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_H);
  const paddingBottom = Math.max(40, insets.bottom + 16);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_H, { duration: 300 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleGoLogin = (): void => {
    onClose();
    router.push('/(tabs)/profile');
  };

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
                padding: 24,
                paddingBottom,
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

              <Text fontSize={14} color="$muted" mb="$5">
                {labels.subtitle}
              </Text>

              <Pressable
                onPress={handleGoLogin}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text fontSize={16} fontWeight="700" color="$primaryForeground">
                  {labels.button_text}
                </Text>
              </Pressable>
            </YStack>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
