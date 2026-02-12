import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { TamaguiProvider } from 'tamagui';
import { PortalProvider } from '@tamagui/portal';
import { config } from '../tamagui.config';
import { AuthProvider, useAuthValue } from '@/hooks/useAuth';

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
            </Stack>
          </AuthProvider>
        </PortalProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
