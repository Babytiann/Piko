import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GlassView } from 'expo-glass-effect';

interface Props {
  tintColor?: string;
}

export default function GlassOverlay({ tintColor }: Props): ReactNode {
  return (
    <GlassView
      style={styles.glassClip}
      glassEffectStyle="regular"
      tintColor={tintColor}
    />
  );
}

const styles = StyleSheet.create({
  glassClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    overflow: 'hidden',
  },
});
