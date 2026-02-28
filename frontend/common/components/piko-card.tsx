import type { ReactNode } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import type { ViewStyle } from 'react-native';

import { getThemeColors } from '@/common/consts/theme';
import type { ColorScheme } from '@/common/consts/theme';

type PikoCardPadding = '$2' | '$3' | '$4';

const PADDING_MAP: Record<PikoCardPadding, number> = {
  $2: 8,
  $3: 12,
  $4: 16,
};

interface PikoCardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: PikoCardPadding;
  noPadding?: boolean;
  style?: ViewStyle;
}

function cardContent(
  children: ReactNode,
  padding: PikoCardPadding | undefined,
  noPadding: boolean,
  style: ViewStyle | undefined,
  scheme: ColorScheme,
): ReactNode {
  const colors = getThemeColors(scheme);
  const baseStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: noPadding ? 0 : ((padding && PADDING_MAP[padding]) ?? 16),
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    boxShadow: colors.subtleShadow,
  };
  return <View style={[baseStyle, style]}>{children}</View>;
}

export function PikoCard({
  children,
  onPress,
  padding = '$4',
  noPadding = false,
  style,
}: PikoCardProps): ReactNode {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  const content = cardContent(children, padding, noPadding, style, scheme);
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}
