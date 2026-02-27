import type {
  BudgetCardData,
  BudgetCardNeedSet,
  CategoryCardsData,
  HomeSlashResponse,
  WeatherCardData,
  WeekCalendarData,
} from '../../../types/home.js';
import { getUserBudget } from '../budget/index.js';
import { listExpenses } from '../expense/index.js';
import { fetchCurrentWeather } from '../weather/current.js';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const DEFAULT_CITY = '上海';

function getWeekBounds(anchor: Date): { start: Date; end: Date } {
  const d = new Date(anchor);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekOfMonth = Math.ceil((date.getDate() + first.getDay()) / 7);
  return `${month}月第${weekOfMonth}周`;
}

export async function getHomePageData(
  userId: string,
): Promise<HomeSlashResponse> {
  const now = new Date();
  const { start, end } = getWeekBounds(now);
  const startStr = formatDateKey(start);
  const endStr = formatDateKey(end);

  const lastWeekStart = new Date(start);
  lastWeekStart.setDate(start.getDate() - 7);
  const lastWeekEnd = new Date(end);
  lastWeekEnd.setDate(end.getDate() - 7);
  const lastWeekStartStr = formatDateKey(lastWeekStart);
  const lastWeekEndStr = formatDateKey(lastWeekEnd);

  const [weeklyBudget, expenseRes, lastWeekRes, weatherResult] =
    await Promise.all([
      getUserBudget(userId),
      listExpenses(userId, {
        startDate: startStr,
        endDate: endStr,
        pageSize: 100,
        page: 1,
      }),
      listExpenses(userId, {
        startDate: lastWeekStartStr,
        endDate: lastWeekEndStr,
        pageSize: 100,
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

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const lastWeekSpent = lastWeekRes.expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const daysInWeek = 7;
  const dailyAverage = totalSpent / daysInWeek;

  const weekLabel = getWeekLabel(now);
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
    selectedDate: formatDateKey(now),
    days,
  };

  let budgetCardData: BudgetCardData | BudgetCardNeedSet;
  if (weeklyBudget == null) {
    budgetCardData = { needSetBudget: true };
  } else {
    const usedPercent =
      weeklyBudget > 0
        ? Math.min(100, Math.round((totalSpent / weeklyBudget) * 100))
        : 0;
    const remaining = Math.max(0, weeklyBudget - totalSpent);
    let trendPercent: number | undefined;
    if (lastWeekSpent > 0) {
      const change = ((totalSpent - lastWeekSpent) / lastWeekSpent) * 100;
      trendPercent = Math.round(change * 10) / 10;
    }
    budgetCardData = {
      weeklyBudget: weeklyBudget,
      spent: Math.round(totalSpent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      usedPercent,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      trendPercent,
    };
  }

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

  const categoryCardsData: CategoryCardsData = {
    categories: Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    })),
  };

  const nodes: HomeSlashResponse['nodes'] = {
    week_calendar: { type: 'component', data: weekCalendarData },
    budget_card: { type: 'component', data: budgetCardData },
    weather_card: weatherCardData
      ? { type: 'component', data: weatherCardData }
      : undefined,
    category_cards: { type: 'component', data: categoryCardsData },
  };

  return {
    layout: {
      body: ['week_calendar', 'budget_card', 'weather_card', 'category_cards'],
    },
    nodes,
  };
}
