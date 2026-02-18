import type { ReactNode } from 'react';
import { Text } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function WaitingIndicator(): ReactNode {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withTiming(0.25, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    }),
    -1,
    true,
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Text fontSize="$3" color="$blue9" ml="$1">
        ●
      </Text>
    </Animated.View>
  );
}
