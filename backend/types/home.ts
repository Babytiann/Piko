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

export interface HomeLabels {
  quick_stats: {
    today: string;
    week: string;
    month: string;
  };
  week_calendar: {
    title: string;
    weekday_labels: string[];
    date_picker_title: string;
    today_label: string;
    month_names: string[];
    day_names: string[];
    day_names_short: string[];
  };
  budget_card: {
    set_cta_title: string;
    set_cta_desc: string;
    set_cta_button: string;
    monthly_budget_label: string;
    month_spent_label: string;
    weekly_budget_label: string;
    week_used_label: string;
    week_spent_label: string;
    week_remaining_label: string;
    daily_avg_label: string;
    edit_sheet_title: string;
    edit_amount_label: string;
  };
  budget_setup: {
    title: string;
    subtitle: string;
    input_label: string;
    placeholder: string;
  };
  category_cards: {
    title: string;
    view_all: string;
    all_sheet_title: string;
    by_amount: string;
    by_name: string;
    week_total: string;
    ratio_label: string;
    no_records: string;
    fallback_category: string;
  };
  expense_list: {
    today_label: string;
    date_format: string;
    count_format: string;
    view_all: string;
    view_all_format: string;
    no_records: string;
  };
  recognition: {
    recognizing: string;
    complete: string;
    failed: string;
    view_detail: string;
    result_title: string;
    confirm: string;
    close: string;
    amount_label: string;
    merchant_label: string;
    category_label: string;
    date_label: string;
    confidence_label: string;
    items_label: string;
    delete_title: string;
    delete_confirm: string;
    delete_button: string;
  };
  common: {
    currency_symbol: string;
    retry: string;
    cancel: string;
    ok: string;
    save: string;
    saving: string;
    loading: string;
    network_error: string;
    save_failed: string;
    error_default: string;
    error_network: string;
    error_empty: string;
    error_unavailable: string;
    error_auth: string;
  };
  login_prompt: {
    title: string;
    subtitle: string;
    button_text: string;
  };
  weather_city_picker: {
    title: string;
    auto_locate_label: string;
    auto_locate_denied_hint: string;
    confirm_label: string;
    saving_label: string;
    locating_label: string;
    locate_click_hint: string;
    province_label: string;
    city_label: string;
    empty_options_hint: string;
    located_success_hint: string;
    locate_failed_hint: string;
    geocode_failed_hint: string;
  };
}

export interface WeatherCityOption {
  name: string;
  cities: string[];
}

export interface HomeSlashLayout {
  body: string[];
}

export interface HomeSlashResponse {
  layout: HomeSlashLayout;
  nodes: HomeSlashNodes;
  labels: HomeLabels;
  extra?: {
    weather_city_options: WeatherCityOption[];
  };
}
