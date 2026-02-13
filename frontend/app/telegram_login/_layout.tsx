import type { ReactNode } from 'react';
import { Stack } from 'expo-router';

export default function TelegramLoginLayout(): ReactNode {
  return <Stack screenOptions={{ headerShown: false }} />;
}
