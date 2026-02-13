import { YStack, Spacer, Text } from 'tamagui';
import usePageData from '@/hooks/usePageData';
import { fetchHomePage } from '@/services/home';
import type { HomePageData } from '@/types/home';
import PageLoading from '@/components/shared/pageLoading';
import PageError from '@/components/shared/pageStatusView';
import WelcomeCard from '@/components/home/welcome-card';
import { useAppSafeArea } from '@/hooks/useSafeArea';

export default function HomeScreen() {
  const { top, bottom } = useAppSafeArea();
  const { data, loading, error, refresh } = usePageData<HomePageData>(
    () => fetchHomePage(),
    [],
  );

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={refresh} />;
  if (!data) return null;

  return (
    <YStack flex={1} pt={top} pb={bottom} px="$4" bg="$background">
      <Spacer size="$4" />
      <Text fontSize="$7" fontWeight="700" color="$color" letterSpacing={-0.5}>
        {data.header.title}
      </Text>
      <Spacer size="$3" />
      <WelcomeCard data={data.welcomeCard} />
    </YStack>
  );
}
