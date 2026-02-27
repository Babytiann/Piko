import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { CARD_BACKGROUND } from '@/common/consts/theme';

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
  backgroundColor: string,
): ReactNode {
  const baseStyle: ViewStyle = {
    backgroundColor,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: noPadding ? 0 : ((padding && PADDING_MAP[padding]) ?? 16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
  const content = cardContent(
    children,
    padding,
    noPadding,
    style,
    CARD_BACKGROUND,
  );
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
