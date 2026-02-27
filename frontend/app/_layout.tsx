import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { TamaguiProvider } from 'tamagui';
import { PortalProvider } from '@tamagui/portal';
import { config } from '../tamagui.config';
import { AuthProvider, useAuthValue } from '@/common/hooks';

export default function RootLayout() {
  const scheme = useColorScheme();
  const authValue = useAuthValue();

  return (
    <SafeAreaProvider>
      <TamaguiProvider
        config={config}
        defaultTheme={scheme === 'dark' ? 'dark' : 'light'}
      >
        <PortalProvider shouldAddRootHost>
          <AuthProvider value={authValue}>
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: '#ffffff' },
                headerShadowVisible: true,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ title: '' }} />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: true,
                  title: 'Chat',
                  headerShadowVisible: true,
                  headerStyle: { backgroundColor: '#ffffff' },
                }}
              />
              <Stack.Screen
                name="telegram_login"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="telegram-dialog/index"
                options={{
                  headerShown: false,
                  title: '',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="scan/index"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="telegram_binding/index"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="budget-setup/index"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
          </AuthProvider>
        </PortalProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
