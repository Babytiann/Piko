import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

interface TgLoginGlassBackgroundProps {
  children: ReactNode;
  isDark: boolean;
}

export function TgLoginGlassBackground({
  children,
  isDark,
}: TgLoginGlassBackgroundProps): ReactNode {
  const hasGlass = isLiquidGlassAvailable();
  const bgColor = isDark ? '#2C2C2E' : '#FFFFFF';

  if (hasGlass) {
    return (
      <View
        style={[styles.container, styles.shadow, { backgroundColor: bgColor }]}
      >
        <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, styles.shadow, { backgroundColor: bgColor }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
});
