import type { ReactNode } from 'react';
import { useState, useCallback, useContext } from 'react';

import { ScrollView } from 'react-native';
import { YStack, Text, Spacer } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';
import type {
  BudgetCardNodeData,
  CategoryCardsData,
  ExpenseListData,
  HomeHeaderData,
  HomeLabels,
  HomeSlashNodes,
  QuickStatsData,
  WeatherCardData,
  WeekCalendarData,
} from '@/common/typings/home';
import { RecognitionContext } from '@/contexts/recognition-context';

import { useFetchData } from '@/pages/home/hooks/useFetchData';
import HomeQuickStats from '@/pages/home/components/home-quick-stats';
import HomeWeekCalendar from '@/pages/home/components/home-week-calendar';
import HomeBudgetCard from '@/pages/home/components/home-budget-card';
import HomeWeatherCard from '@/pages/home/components/home-weather-card';
import HomeHeroCard from '@/pages/home/components/home-hero-card';
import HomeCategoryCards from '@/pages/home/components/home-category-cards';
import HomeExpenseList from '@/pages/home/components/home-expense-list';
import HomeRecognitionProgress from '@/pages/home/components/home-recognition-progress';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';

function renderSlot(
  slotId: string,
  nodes: HomeSlashNodes,
  labels: HomeLabels,
  onWeekChange: (date: string) => void,
  onBudgetUpdated: () => void,
  onDateSelect: (date: string) => void,
  selectedDate: string,
): ReactNode {
  const node = nodes[slotId as keyof HomeSlashNodes];
  const data = node?.type === 'component' ? node.data : undefined;
  if (data == null) return null;

  switch (slotId) {
    case 'quick_stats': {
      const wNode = nodes.weather_card;
      const wData =
        wNode?.type === 'component'
          ? (wNode.data as WeatherCardData | undefined)
          : undefined;
      if (wData) {
        return (
          <HomeHeroCard
            quickStats={data as QuickStatsData}
            weather={wData}
            labels={labels}
          />
        );
      }
      return <HomeQuickStats data={data as QuickStatsData} labels={labels} />;
    }
    case 'week_calendar':
      return (
        <HomeWeekCalendar
          data={data as WeekCalendarData}
          labels={labels}
          onWeekChange={onWeekChange}
          onDateSelect={onDateSelect}
          selectedDate={selectedDate}
        />
      );
    case 'budget_card':
      return (
        <HomeBudgetCard
          data={data as BudgetCardNodeData}
          labels={labels}
          onBudgetUpdated={onBudgetUpdated}
        />
      );
    case 'weather_card':
      return <HomeWeatherCard data={data as WeatherCardData} />;
    case 'category_cards': {
      const expNode = nodes.expense_list;
      const expData =
        expNode?.type === 'component'
          ? (expNode.data as ExpenseListData | undefined)
          : undefined;
      return (
        <HomeCategoryCards
          data={data as CategoryCardsData}
          labels={labels}
          allExpenses={expData?.expenses}
        />
      );
    }
    case 'expense_list':
      return (
        <HomeExpenseList
          data={data as ExpenseListData}
          labels={labels}
          selectedDate={selectedDate}
        />
      );
    default:
      return null;
  }
}

export default function HomeScreen(): ReactNode {
  const { top, bottom } = useSafeAreaInsets();
  const {
    isLoading,
    errorType,
    bodyLayout,
    nodes,
    labels,
    handleRetry,
    handleRefreshWithDate,
    handleSilentRefresh,
  } = useFetchData();
  const recognition = useContext(RecognitionContext);

  const headerNode = nodes?.header;
  const headerData =
    headerNode?.type === 'component'
      ? (headerNode.data as HomeHeaderData | undefined)
      : undefined;

  const expenseNode = nodes?.expense_list;
  const expenseData =
    expenseNode?.type === 'component'
      ? (expenseNode.data as ExpenseListData | undefined)
      : undefined;
  const todayDate =
    expenseData?.today_date ?? new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  const currentSelectedDate = selectedDate;

  const onWeekChange = useCallback(
    (date: string): void => {
      handleRefreshWithDate(date);
      setSelectedDate(date);
    },
    [handleRefreshWithDate],
  );

  const onDateSelect = useCallback((date: string): void => {
    setSelectedDate(date);
  }, []);

  const onBudgetUpdated = useCallback((): void => {
    handleSilentRefresh();
  }, [handleSilentRefresh]);

  if (isLoading) return <PageLoading />;
  if (errorType) {
    return (
      <PageStatusView
        errorType={errorType}
        onRetry={handleRetry}
        labels={labels?.common}
      />
    );
  }
  if (!nodes || !labels || bodyLayout.length === 0) {
    return null;
  }

  const contentPadding = {
    paddingTop: top,
    paddingBottom: bottom + TAB_BAR_CONTENT_HEIGHT,
    paddingHorizontal: 16,
  };

  const showRecognition = recognition.status !== 'idle';

  const slots: ReactNode[] = [];
  for (let i = 0; i < bodyLayout.length; i++) {
    const slotId = bodyLayout[i];

    if (slotId === 'category_cards' && showRecognition) {
      slots.push(
        <YStack key="recognition_progress">
          <HomeRecognitionProgress labels={labels} />
        </YStack>,
      );
    }

    if (slotId === 'weather_card') continue;

    slots.push(
      <YStack key={slotId}>
        {renderSlot(
          slotId,
          nodes,
          labels,
          onWeekChange,
          onBudgetUpdated,
          onDateSelect,
          currentSelectedDate,
        )}
      </YStack>,
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={contentPadding}
        showsVerticalScrollIndicator={false}
      >
        <Spacer size="$2" />
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <YStack px="$1" mb="$2">
            <Text fontSize={26} fontWeight="800" color="$color">
              {headerData?.greeting ?? '你好'}
            </Text>
            <Text fontSize={13} color="$muted" mt={2}>
              {headerData?.subtitle ?? '记录每一笔'}
            </Text>
          </YStack>
        </Animated.View>
        <YStack gap="$3">{slots}</YStack>
      </ScrollView>
    </YStack>
  );
}
