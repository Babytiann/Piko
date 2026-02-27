import type { ExpenseCategory } from '../types';

/** 所有可用的消费分类 */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '生活',
  '医疗',
  '教育',
  '其他',
];

/** 分类 → 图标名称映射 */
export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  餐饮: 'restaurant-outline',
  交通: 'car-outline',
  购物: 'bag-outline',
  娱乐: 'game-controller-outline',
  生活: 'home-outline',
  医疗: 'medical-outline',
  教育: 'school-outline',
  其他: 'ellipsis-horizontal-outline',
};

/** 分类 → 主题色映射（Tamagui token，统一主色） */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  餐饮: '$primary',
  交通: '$primary',
  购物: '$primary',
  娱乐: '$primary',
  生活: '$primary',
  医疗: '$primary',
  教育: '$primary',
  其他: '$primary',
};
