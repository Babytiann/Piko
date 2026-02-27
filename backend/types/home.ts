/** Slash 式首页：layout 定序，nodes 载数。 */

export interface WeekCalendarData {
  weekLabel: string;
  selectedDate: string;
  days: Array<{
    date: string;
    weekday: string;
    amount: number;
  }>;
}

export interface BudgetCardData {
  weeklyBudget: number;
  spent: number;
  remaining: number;
  usedPercent: number;
  dailyAverage: number;
  trendPercent?: number;
}

/** 用户未设置预算时，前端展示「设置预算」入口 */
export interface BudgetCardNeedSet {
  needSetBudget: true;
}

export type BudgetCardNodeData = BudgetCardData | BudgetCardNeedSet;

export interface WeatherCardData {
  city: string;
  temperature: number;
  tempMin: number;
  tempMax: number;
  description: string;
  humidity?: number;
  windSpeed?: number;
}

export interface CategoryCardItem {
  category: string;
  amount: number;
}

export interface CategoryCardsData {
  categories: CategoryCardItem[];
}

export type HomeSlashNodeType = 'container' | 'component' | 'group';

export interface HomeSlashNode<T = unknown> {
  type: HomeSlashNodeType;
  data?: T;
}

export interface HomeSlashNodes {
  week_calendar?: HomeSlashNode<WeekCalendarData>;
  budget_card?: HomeSlashNode<BudgetCardNodeData>;
  weather_card?: HomeSlashNode<WeatherCardData>;
  category_cards?: HomeSlashNode<CategoryCardsData>;
}

export interface HomeSlashLayout {
  body: string[];
}

export interface HomeSlashResponse {
  layout: HomeSlashLayout;
  nodes: HomeSlashNodes;
}

/** 兼容旧版：仅保留以便渐进迁移 */
export interface WelcomeCard {
  title: string;
  description: string;
}

export interface HomePageData {
  header: { title: string };
  welcome_card: WelcomeCard;
}
