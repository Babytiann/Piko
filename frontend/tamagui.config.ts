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
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#141416',
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
