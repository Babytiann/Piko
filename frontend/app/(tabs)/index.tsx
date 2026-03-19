import type { ReactNode } from 'react';
import { useState, useCallback, useContext, useEffect, useRef } from 'react';

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

import { authClient } from '@/services/auth-client';
import useLocation from '@/pages/ai-chat/hooks/useLocation';
import { appEvents } from '@/common/lib/app-events';
import { useFetchData } from '@/pages/home/hooks/useFetchData';
import HomeQuickStats from '@/pages/home/components/home-quick-stats';
import { fetchReverseGeocode } from '@/services/home';
import HomeWeekCalendar from '@/pages/home/components/home-week-calendar';
import HomeBudgetCard from '@/pages/home/components/home-budget-card';
import HomeWeatherCard from '@/pages/home/components/home-weather-card';
import HomeHeroCard from '@/pages/home/components/home-hero-card';
import HomeCategoryCards from '@/pages/home/components/home-category-cards';
import HomeExpenseList from '@/pages/home/components/home-expense-list';
import HomeRecognitionProgress from '@/pages/home/components/home-recognition-progress';
import HomeLoginPromptSheet from '@/pages/home/components/home-login-prompt-sheet';
import HomeWeatherCitySheet from '@/pages/home/components/home-weather-city-sheet';

import { TAB_BAR_CONTENT_HEIGHT } from '@/common/consts';

function renderSlot(
  slotId: string,
  nodes: HomeSlashNodes,
  labels: HomeLabels,
  onWeekChange: (date: string) => void,
  onBudgetUpdated: () => void,
  onDateSelect: (date: string) => void,
  selectedDate: string,
  isLoggedIn: boolean,
  onLoginRequired: () => void,
  onWeatherCityPress: () => void,
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
            onWeatherPress={onWeatherCityPress}
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
          isLoggedIn={isLoggedIn}
          onLoginRequired={onLoginRequired}
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
  const { getLocation } = useLocation();
  const [autoWeatherCity, setAutoWeatherCity] = useState<string | undefined>();

  useEffect(() => {
    getLocation()
      .then((loc) => {
        if (!loc) return;
        return fetchReverseGeocode(loc.latitude, loc.longitude);
      })
      .then((res) => {
        if (res?.success && res.data?.city) {
          setAutoWeatherCity(res.data.city);
        }
      });
  }, [getLocation]);

  const { data: appSession } = authClient.useSession();
  const {
    isLoading,
    errorType,
    bodyLayout,
    nodes,
    labels,
    weatherCityOptions,
    handleRetry,
    handleRefreshWithDate,
    handleSilentRefresh,
  } = useFetchData(undefined, autoWeatherCity, appSession?.user?.id ?? null);
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
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [showWeatherCitySheet, setShowWeatherCitySheet] = useState(false);

  const currentSelectedDate = selectedDate;
  const isLoggedIn = !!appSession?.user?.id;
  const weatherCity =
    nodes?.weather_card?.type === 'component' && nodes.weather_card.data
      ? (nodes.weather_card.data as WeatherCardData).city
      : undefined;

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

  // 监听预算更新事件（来自 budget-setup 页或 budget-edit-sheet），立即触发首页刷新
  const handleSilentRefreshRef = useRef(handleSilentRefresh);
  handleSilentRefreshRef.current = handleSilentRefresh;

  useEffect(() => {
    return appEvents.on('budget-updated', () => {
      handleSilentRefreshRef.current();
    });
  }, []);

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
          isLoggedIn,
          () => setShowLoginSheet(true),
          () => setShowWeatherCitySheet(true),
        )}
      </YStack>,
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <HomeLoginPromptSheet
        visible={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        labels={
          labels.login_prompt ?? {
            title: '登录后使用更多功能',
            subtitle: '登录后可同步数据、设置预算与查看消费统计',
            button_text: '去登录',
          }
        }
      />
      <HomeWeatherCitySheet
        visible={showWeatherCitySheet}
        currentCity={weatherCity}
        onClose={() => setShowWeatherCitySheet(false)}
        onSaved={handleSilentRefresh}
        weatherCityOptions={weatherCityOptions ?? []}
        labels={
          labels.weather_city_picker ?? {
            title: '选择城市',
            auto_locate_label: '使用当前位置',
            auto_locate_denied_hint:
              '未开启定位权限，可在设置中开启或手动选择城市',
            confirm_label: '确定',
            saving_label: '保存中...',
            locating_label: '定位中...',
            locate_click_hint: '点击使用当前位置',
            province_label: '省份',
            city_label: '城市',
            empty_options_hint: '暂无城市列表，请稍后重试',
            located_success_hint: '已定位到 {city}，请点击下方确定保存',
            locate_failed_hint: '定位失败，请检查权限或网络',
            geocode_failed_hint: '无法识别当前位置，请手动选择城市',
          }
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={contentPadding}
        showsVerticalScrollIndicator={false}
      >
        <Spacer size="$2" />
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <YStack px="$1" mb="$2">
            <Text fontSize={30} fontWeight="900" color="$color">
              {headerData?.greeting ?? '你好'}
            </Text>
            <Text fontSize={13} color="$muted" mt={2}>
              {headerData?.subtitle ?? '记录每一笔'}
            </Text>
          </YStack>
        </Animated.View>
        <YStack gap="$3.5">{slots}</YStack>
      </ScrollView>
    </YStack>
  );
}
