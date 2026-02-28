/**
 * 设计 Token：应用背景灰、模块/卡片白，主色与语义色统一。
 * 所有 UI 颜色由此处或 Tamagui themes 派生，避免硬编码 hex。
 */

import { Platform } from 'react-native';

const tintColorLight = '#11181C';
const tintColorDark = '#F5F5F5';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F5F5F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#141416',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/** 主色（按钮、选中态、链接） */
export const PRIMARY = '#11181C';
export const PRIMARY_FOREGROUND = '#FFFFFF';
/** 次要文字/图标 */
export const MUTED = '#687076';
/** 卡片背景（模块白，与页面灰区分） */
export const CARD_BACKGROUND = '#FFFFFF';
/** 边框/分割线 */
export const BORDER = '#E5E5EA';
/** 错误/危险 */
export const DESTRUCTIVE = '#FF3B30';
/** 成功/正向 */
export const SUCCESS = '#34C759';
/** 警告 */
export const WARNING = '#E67E00';

/** 预算环形图（主色系） */
export const BUDGET_RING_COLOR = '#FBBF24';
export const BUDGET_RING_BG_COLOR = '#E5E5EA';

/** 消费分类卡片背景（浅浅多巴胺，低饱和统一） */
export const EXPENSE_CATEGORY_COLORS = {
  餐饮: '#F5E6E6',
  交通: '#E6EDF2',
  娱乐: '#EDE8F2',
  购物: '#E8F0E8',
  生活: '#E8EEF2',
  医疗: '#F5E8E8',
  教育: '#F2EDE6',
  其他: '#F0EDED',
} as const;

export const CATEGORY_ICON_CONFIG: Record<
  string,
  { bgColor: string; iconColor: string; icon: string }
> = {
  餐饮: {
    bgColor: '#FFF7ED',
    iconColor: '#EA580C',
    icon: 'restaurant-outline',
  },
  交通: { bgColor: '#EFF6FF', iconColor: '#2563EB', icon: 'car-outline' },
  娱乐: {
    bgColor: '#F5F3FF',
    iconColor: '#7C3AED',
    icon: 'musical-notes-outline',
  },
  购物: { bgColor: '#FFF1F2', iconColor: '#E11D48', icon: 'bag-outline' },
  生活: { bgColor: '#F0FDF4', iconColor: '#16A34A', icon: 'home-outline' },
  医疗: { bgColor: '#FEF2F2', iconColor: '#DC2626', icon: 'medkit-outline' },
  健康: { bgColor: '#FDF2F8', iconColor: '#DB2777', icon: 'heart-outline' },
  教育: { bgColor: '#FFFBEB', iconColor: '#D97706', icon: 'school-outline' },
  其他: {
    bgColor: '#F5F5F5',
    iconColor: '#71717A',
    icon: 'ellipsis-horizontal-outline',
  },
};

/** 天气卡片渐变（浅中性） */
export const WEATHER_CARD_GRADIENT = ['#F5F5F5', '#EEEEEE'];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
