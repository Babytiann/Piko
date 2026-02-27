import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { BUDGET_RING_BG_COLOR, BUDGET_RING_COLOR } from '@/common/consts/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PikoRingChartProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  centerIcon?: ReactNode;
  animated?: boolean;
}

export function PikoRingChart({
  progress,
  size = 120,
  strokeWidth = 10,
  color = BUDGET_RING_COLOR,
  bgColor = BUDGET_RING_BG_COLOR,
  centerIcon,
  animated = true,
}: PikoRingChartProps): ReactNode {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const sharedProgress = useSharedValue(animated ? 0 : clamped);

  useEffect(() => {
    sharedProgress.value = withSpring(clamped, { damping: 15, stiffness: 120 });
  }, [clamped, sharedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const p = animated ? sharedProgress.value : clamped;
    return {
      strokeDashoffset: circumference * (1 - p),
    };
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: 'center',
        position: 'relative',
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      {centerIcon ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {centerIcon}
        </View>
      ) : null}
    </View>
  );
}
