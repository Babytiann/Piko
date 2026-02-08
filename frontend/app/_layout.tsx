import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { TamaguiProvider } from 'tamagui';
import { config } from '../tamagui.config';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthScreen = segments[0] === 'login';

    if (!isLoggedIn && !inAuthScreen) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme={scheme === 'dark' ? 'dark' : 'light'}>
        <AuthProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: true,
                  title: 'Chat',
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Modal',
                }}
              />
            </Stack>
          </AuthGate>
        </AuthProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
