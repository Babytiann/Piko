import type {
  BudgetCardData,
  BudgetCardNeedSet,
  CategoryCardsData,
  ExpenseListData,
  ExpenseListItem,
  HomeHeaderData,
  HomeLabels,
  HomeSlashResponse,
  QuickStatsData,
  WeatherCardData,
  WeekCalendarData,
} from '../../../types/home.js';
import { getUserBudget } from '../budget/index.js';
import { listExpenses } from '../expense/index.js';
import { fetchCurrentWeather } from '../weather/current.js';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const HOME_LABELS: HomeLabels = {
  quick_stats: { today: '今日', week: '本周', month: '本月' },
  week_calendar: {
    title: '本周概览',
    weekday_labels: WEEKDAY_LABELS,
    date_picker_title: '选择日期',
    today_label: '今天',
    month_names: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
    day_names: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    day_names_short: ['日', '一', '二', '三', '四', '五', '六'],
  },
  budget_card: {
    set_cta_title: '设置每月预算',
    set_cta_desc: '设置后即可查看月度预算与每周进度',
    set_cta_button: '去设置',
    monthly_budget_label: '月预算',
    month_spent_label: '本月已花',
    weekly_budget_label: '本周预算',
    week_used_label: '本周已用',
    week_spent_label: '本周已花',
    week_remaining_label: '本周剩余',
    daily_avg_label: '日均消费',
    edit_sheet_title: '修改月预算',
    edit_amount_label: '每月预算金额',
  },
  budget_setup: {
    title: '设置每月预算',
    subtitle: '设置后可在首页查看月度预算与每周进度',
    input_label: '每月预算（元）',
    placeholder: '例如 5000',
  },
  category_cards: {
    title: '消费分类',
    view_all: '查看全部',
    all_sheet_title: '全部分类',
    by_amount: '按金额',
    by_name: '按名称',
    week_total: '本周合计',
    ratio_label: '占比',
    no_records: '暂无消费记录',
    fallback_category: '其他',
  },
  expense_list: {
    today_label: '今日消费',
    date_format: '{month}月{day}日消费',
    count_format: '共 {count} 笔，合计',
    view_all: '查看全部',
    view_all_format: '查看全部 {count} 笔',
    no_records: '当日暂无消费记录',
  },
  recognition: {
    recognizing: 'AI 识别中',
    complete: '识别完成',
    failed: '识别失败',
    view_detail: '查看详情',
    result_title: '识别结果',
    confirm: '确认',
    close: '关闭',
    amount_label: '金额',
    merchant_label: '商户',
    category_label: '分类',
    date_label: '日期',
    confidence_label: '置信度',
    items_label: '明细',
    delete_title: '删除消费',
    delete_confirm: '确认删除这笔消费记录？',
    delete_button: '删除',
  },
  common: {
    currency_symbol: '¥',
    retry: '重试',
    cancel: '取消',
    ok: '确定',
    save: '保存',
    saving: '保存中...',
    loading: '加载中...',
    network_error: '网络异常',
    save_failed: '设置失败',
    error_default: '出错了',
    error_network: '网络连接异常',
    error_empty: '暂无数据',
    error_unavailable: '服务不可用',
    error_auth: '登录已失效',
  },
};
const DEFAULT_CITY = '上海';

function getWeekBounds(anchor: Date): { start: Date; end: Date } {
  const d = new Date(anchor);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const start = new Date(d);
  start.setDate(d.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthBounds(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) {
    return '';
  }
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getWeekLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekOfMonth = Math.ceil((date.getDate() + first.getDay()) / 7);
  return `${month}月第${weekOfMonth}周`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getGreeting(now: Date): string {
  const h = now.getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export async function getHomePageData(
  userId: string,
  selectedDate?: string,
): Promise<HomeSlashResponse> {
  const now = new Date();
  const anchor = selectedDate ? new Date(selectedDate) : now;
  const { start, end } = getWeekBounds(anchor);
  const startStr = formatDateKey(start);
  const endStr = formatDateKey(end);

  const lastWeekStart = new Date(start);
  lastWeekStart.setDate(start.getDate() - 7);
  const lastWeekEnd = new Date(end);
  lastWeekEnd.setDate(end.getDate() - 7);
  const lastWeekStartStr = formatDateKey(lastWeekStart);
  const lastWeekEndStr = formatDateKey(lastWeekEnd);

  const todayStr = formatDateKey(now);

  const monthBounds = getMonthBounds(now);
  const monthStartStr = formatDateKey(monthBounds.start);
  const monthEndStr = formatDateKey(monthBounds.end);

  const [budgetResult, expenseRes, lastWeekRes, monthRes, weatherResult] =
    await Promise.all([
      getUserBudget(userId),
      listExpenses(userId, {
        startDate: startStr,
        endDate: endStr,
        pageSize: 500,
        page: 1,
      }),
      listExpenses(userId, {
        startDate: lastWeekStartStr,
        endDate: lastWeekEndStr,
        pageSize: 100,
        page: 1,
      }),
      listExpenses(userId, {
        startDate: monthStartStr,
        endDate: monthEndStr,
        pageSize: 500,
        page: 1,
      }),
      fetchCurrentWeather(DEFAULT_CITY).catch(() => null),
    ]);

  const expenses = expenseRes.expenses;
  const byDate: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const e of expenses) {
    const dateKey = e.date.slice(0, 10);
    byDate[dateKey] = (byDate[dateKey] ?? 0) + e.amount;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }

  const lastWeekByDate: Record<string, number> = {};
  for (const e of lastWeekRes.expenses) {
    const dateKey = e.date.slice(0, 10);
    lastWeekByDate[dateKey] = (lastWeekByDate[dateKey] ?? 0) + e.amount;
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const lastWeekSpent = lastWeekRes.expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const daysInWeek = 7;
  const dailyAverage = totalSpent / daysInWeek;

  const dailySpent: number[] = [];
  const lastWeekDailySpent: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dailySpent.push(round2(byDate[formatDateKey(d)] ?? 0));

    const ld = new Date(lastWeekStart);
    ld.setDate(lastWeekStart.getDate() + i);
    lastWeekDailySpent.push(round2(lastWeekByDate[formatDateKey(ld)] ?? 0));
  }

  // --- header ---
  const headerData: HomeHeaderData = {
    greeting: getGreeting(now),
    subtitle: '记录每一笔',
  };

  // --- week_calendar ---
  const weekLabel = getWeekLabel(anchor);
  const days: WeekCalendarData['days'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateKey = formatDateKey(d);
    days.push({
      date: dateKey,
      weekday: WEEKDAY_LABELS[i],
      amount: byDate[dateKey] ?? 0,
    });
  }

  const weekCalendarData: WeekCalendarData = {
    weekLabel,
    selectedDate: formatDateKey(anchor),
    days,
  };

  // --- shared month total (used by budget_card + quick_stats) ---
  const monthTotal = monthRes.expenses.reduce((s, e) => s + e.amount, 0);

  // --- budget_card ---
  let budgetCardData: BudgetCardData | BudgetCardNeedSet;
  if (budgetResult == null) {
    budgetCardData = { needSetBudget: true };
  } else {
    const { weeklyBudget, monthlyBudget } = budgetResult;
    const usedPercent =
      weeklyBudget > 0 ? Math.round((totalSpent / weeklyBudget) * 100) : 0;
    const remaining = Math.max(0, weeklyBudget - totalSpent);
    let trendPercent: number | undefined;
    if (lastWeekSpent > 0) {
      const change = ((totalSpent - lastWeekSpent) / lastWeekSpent) * 100;
      trendPercent = Math.round(change * 10) / 10;
    }
    budgetCardData = {
      monthlyBudget,
      monthSpent: round2(monthTotal),
      monthRemaining: round2(Math.max(0, monthlyBudget - monthTotal)),
      weeklyBudget,
      spent: round2(totalSpent),
      remaining: round2(remaining),
      usedPercent,
      dailyAverage: round2(dailyAverage),
      trendPercent,
      daily_spent: dailySpent,
      last_week_daily_spent: lastWeekDailySpent,
    };
  }

  // --- weather_card ---
  const weatherCardData: WeatherCardData | null = weatherResult
    ? {
        city: weatherResult.city,
        temperature: weatherResult.temperature,
        tempMin: weatherResult.tempMin,
        tempMax: weatherResult.tempMax,
        description: weatherResult.description,
        humidity: weatherResult.humidity,
        windSpeed: weatherResult.windSpeed,
      }
    : null;

  // --- category_cards ---
  const totalCategoryAmount = Object.values(byCategory).reduce(
    (s, a) => s + a,
    0,
  );
  const categoryCardsData: CategoryCardsData = {
    categories: Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percentage:
        totalCategoryAmount > 0
          ? Math.round((amount / totalCategoryAmount) * 100)
          : 0,
    })),
  };

  // --- expense_list (all week, frontend filters by date) ---
  const allWeekExpenses = expenses;
  const weekTotal = allWeekExpenses.reduce((s, e) => s + e.amount, 0);
  const expenseListData: ExpenseListData = {
    expenses: allWeekExpenses.map(
      (e): ExpenseListItem => ({
        id: e.id,
        category: e.category,
        merchant: e.merchant,
        amount: e.amount,
        date: e.date.slice(0, 10),
        time: formatTime(e.date),
        source: e.source,
        image_url: e.imageUrl,
      }),
    ),
    total_count: allWeekExpenses.length,
    total_amount: round2(weekTotal),
    today_date: todayStr,
  };

  // --- quick_stats ---
  const todayExpenses = expenses.filter(
    (e) => e.date.slice(0, 10) === todayStr,
  );
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const quickStatsData: QuickStatsData = {
    today_amount: round2(todayTotal),
    week_amount: round2(totalSpent),
    month_amount: round2(monthTotal),
  };

  const nodes: HomeSlashResponse['nodes'] = {
    header: { type: 'component', data: headerData },
    quick_stats: { type: 'component', data: quickStatsData },
    week_calendar: { type: 'component', data: weekCalendarData },
    budget_card: { type: 'component', data: budgetCardData },
    weather_card: weatherCardData
      ? { type: 'component', data: weatherCardData }
      : undefined,
    category_cards: { type: 'component', data: categoryCardsData },
    expense_list: { type: 'component', data: expenseListData },
  };

  return {
    layout: {
      body: [
        'quick_stats',
        'week_calendar',
        'budget_card',
        'weather_card',
        'category_cards',
        'expense_list',
      ],
    },
    nodes,
    labels: HOME_LABELS,
  };
}
