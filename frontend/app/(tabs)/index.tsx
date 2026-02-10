import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, Spacer, Text } from 'tamagui';
import { usePageData } from '@/hooks/usePageData';
import { fetchHomePage } from '@/services/home';
import type { HomePageData } from '@/types/home';
import PageLoading from '@/components/shared/page-loading';
import PageError from '@/components/shared/page-error';
import WelcomeCard from '@/components/home/welcome-card';
import { TAB_BAR_CONTENT_HEIGHT } from '@/constants';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, error, refresh } = usePageData<HomePageData>(
    () => fetchHomePage(),
    [],
  );

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  return (
    <YStack
      flex={1}
      pt={insets.top}
      pb={insets.bottom + TAB_BAR_CONTENT_HEIGHT}
      px="$4"
      bg="$background"
    >
      <Spacer size="$4" />
      <Text fontSize="$7" fontWeight="700" color="$color" letterSpacing={-0.5}>
        {data.header.title}
      </Text>
      <Spacer size="$3" />
      <WelcomeCard data={data.welcomeCard} />
    </YStack>
  );
}
