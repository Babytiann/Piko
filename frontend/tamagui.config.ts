import { defaultConfig } from '@tamagui/config/v5';
import { createAnimations } from '@tamagui/animations-react-native';
import { createTamagui } from 'tamagui';

export const config = createTamagui({
  ...defaultConfig,
  animations: createAnimations({
    quick: {
      type: 'spring',
      damping: 20,
      mass: 1.2,
      stiffness: 250,
    },
    medium: {
      type: 'spring',
      damping: 15,
      mass: 0.9,
      stiffness: 150,
    },
    bouncy: {
      type: 'spring',
      damping: 10,
      mass: 0.9,
      stiffness: 100,
    },
  }),
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#F5F5F5',
      primary: '#11181C',
      primaryForeground: '#FFFFFF',
      muted: '#687076',
      card: '#FFFFFF',
      border: '#E5E5EA',
      destructive: '#FF3B30',
      success: '#34C759',
      warning: '#E67E00',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#141416',
      primary: '#ECEDEE',
      primaryForeground: '#11181C',
      muted: '#9BA1A6',
      card: '#1C1C1E',
      border: '#38383A',
      destructive: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
    },
  },
  media: {
    ...defaultConfig.media,
  },
});

type OurConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig {}
}

export default config;
