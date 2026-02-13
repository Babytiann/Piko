import type { ReactNode } from 'react';

import { YStack, Spacer, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PageLoading from '@/common/components/page-loading';
import PageStatusView from '@/common/components/page-status-view';

import { useFetchData } from '@/pages/home/hooks/useFetchData';
import HomeWelcomeCard from '@/pages/home/components/home-welcome-card';

export default function HomeScreen(): ReactNode {
  const { top, bottom } = useSafeAreaInsets();
  const { isLoading, errorType, data, handleRetry } = useFetchData();

  if (isLoading) return <PageLoading />;
  if (errorType)
    return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
  if (!data) return null;

  return (
    <YStack flex={1} pt={top} pb={bottom} px="$4" bg="$background">
      <Spacer size="$4" />
      <Text fontSize="$7" fontWeight="700" color="$color" letterSpacing={-0.5}>
        {data.header.title}
      </Text>
      <Spacer size="$3" />
      <HomeWelcomeCard data={data.welcomeCard} />
    </YStack>
  );
}
