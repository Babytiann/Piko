import { Platform } from 'react-native';

export const TOOLTIP_HEIGHT = 44;
export const TOOLTIP_GAP = 4;
export const BACKDROP_INTENSITY = 30;
export const MESSAGE_SCALE = 1.03;

export const ANIM_DURATION = 200;

export const DRAWER_OPEN_MS = 250;
export const DRAWER_CLOSE_MS = 200;

export const NEAR_BOTTOM_THRESHOLD = 80;
export const SCROLL_DELAY_MS = 16;

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const TABLE_FONT_SIZE = 14;
export const CELL_PAD_H = 10;
export const MIN_COL_W = 60;

export const FLUSH_INTERVAL_MS = 48;
