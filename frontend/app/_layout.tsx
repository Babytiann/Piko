import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { TamaguiProvider } from 'tamagui';
import { config } from '../tamagui.config';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme={scheme === 'dark' ? 'dark' : 'light'}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Modal',
            }}
          />
        </Stack>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
