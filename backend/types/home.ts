/** Slash 式首页：layout 定序，nodes 载数。 */

export interface HomeHeaderData {
  greeting: string;
  subtitle: string;
}

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
  monthlyBudget: number;
  monthSpent: number;
  monthRemaining: number;
  weeklyBudget: number;
  spent: number;
  remaining: number;
  usedPercent: number;
  dailyAverage: number;
  trendPercent?: number;
  daily_spent: number[];
  last_week_daily_spent: number[];
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
  percentage: number;
}

export interface ExpenseListItem {
  id: string;
  category: string;
  merchant: string | null;
  amount: number;
  date: string;
  time: string;
  source: string;
  image_url: string | null;
}

export interface ExpenseListData {
  expenses: ExpenseListItem[];
  total_count: number;
  total_amount: number;
  today_date: string;
}

export interface QuickStatsData {
  today_amount: number;
  week_amount: number;
  month_amount: number;
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
  header?: HomeSlashNode<HomeHeaderData>;
  quick_stats?: HomeSlashNode<QuickStatsData>;
  week_calendar?: HomeSlashNode<WeekCalendarData>;
  budget_card?: HomeSlashNode<BudgetCardNodeData>;
  weather_card?: HomeSlashNode<WeatherCardData>;
  category_cards?: HomeSlashNode<CategoryCardsData>;
  expense_list?: HomeSlashNode<ExpenseListData>;
}

export interface HomeSlashLayout {
  body: string[];
}

export interface HomeSlashResponse {
  layout: HomeSlashLayout;
  nodes: HomeSlashNodes;
}
