import type { ReactNode } from 'react';
import { useState } from 'react';

import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Spacer } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';
import type {
  BudgetCardNodeData,
  CategoryCardsData,
  HomeSlashNodes,
  WeatherCardData,
  WeekCalendarData,
} from '@/common/typings/home';

import { useFetchData } from '@/pages/home/hooks/useFetchData';
import HomeWeekCalendar from '@/pages/home/components/home-week-calendar';
import HomeBudgetCard from '@/pages/home/components/home-budget-card';
import HomeWeatherCard from '@/pages/home/components/home-weather-card';
import HomeCategoryCards from '@/pages/home/components/home-category-cards';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';

function renderSlot(slotId: string, nodes: HomeSlashNodes): ReactNode {
  const node = nodes[slotId as keyof HomeSlashNodes];
  const data = node?.type === 'component' ? node.data : undefined;
  if (data == null) return null;

  switch (slotId) {
    case 'week_calendar':
      return <HomeWeekCalendar data={data as WeekCalendarData} />;
    case 'budget_card':
      return <HomeBudgetCard data={data as BudgetCardNodeData} />;
    case 'weather_card':
      return <HomeWeatherCard data={data as WeatherCardData} />;
    case 'category_cards':
      return <HomeCategoryCards data={data as CategoryCardsData} />;
    default:
      return null;
  }
}

export default function HomeScreen(): ReactNode {
  const { top, bottom } = useSafeAreaInsets();
  const { isLoading, errorType, bodyLayout, nodes, handleRetry } =
    useFetchData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = (): void => {
    setRefreshing(true);
    handleRetry();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isLoading) return <PageLoading />;
  if (errorType) {
    return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
  }
  if (!nodes || bodyLayout.length === 0) {
    return null;
  }

  const contentPadding = {
    paddingTop: top,
    paddingBottom: bottom + TAB_BAR_CONTENT_HEIGHT,
    paddingHorizontal: 16,
  };

  const slots: ReactNode[] = [];
  for (let i = 0; i < bodyLayout.length; i++) {
    const slotId = bodyLayout[i];
    if (slotId === 'budget_card' && bodyLayout[i + 1] === 'weather_card') {
      const budgetNode = nodes.budget_card;
      const weatherNode = nodes.weather_card;
      const budgetData =
        budgetNode?.type === 'component' ? budgetNode.data : undefined;
      const weatherData =
        weatherNode?.type === 'component' ? weatherNode.data : undefined;
      slots.push(
        <XStack key="middle_row" gap="$3" flexDirection="row">
          {budgetData ? (
            <YStack flex={1}>
              <HomeBudgetCard data={budgetData as BudgetCardNodeData} />
            </YStack>
          ) : null}
          {weatherData ? (
            <YStack flex={1}>
              <HomeWeatherCard data={weatherData} />
            </YStack>
          ) : null}
        </XStack>,
      );
      i += 1;
      continue;
    }
    slots.push(<YStack key={slotId}>{renderSlot(slotId, nodes)}</YStack>);
  }

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Spacer size="$4" />
        <YStack gap="$4">{slots}</YStack>
      </ScrollView>
    </YStack>
  );
}
