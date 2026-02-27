/** Data contract for the Home page (mirrors backend Slash). */

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

/** Legacy (pre-Slash) */
export interface WelcomeCard {
  title: string;
  description: string;
}

export interface HomePageData {
  header: { title: string };
  welcome_card: WelcomeCard;
}
