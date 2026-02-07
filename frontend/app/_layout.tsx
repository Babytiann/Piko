import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TamaguiProvider, createTamagui } from "@tamagui/core";
import { defaultConfig } from "@tamagui/config/v5";
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

const config = createTamagui(defaultConfig);

type Conf = typeof config;
declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends Conf {}
}

// 原生导航栏（Header）的全局样式，对所有 Stack 页面生效
const screenOptions = {
  headerStyle: {
    backgroundColor: '#0a7ea4',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 17,
  },
  // 其他常用：headerShadowVisible, headerBackTitleVisible, headerLargeTitle...
};

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme='light'>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            // 单页可覆盖全局：headerStyle: { backgroundColor: '#333' }
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </TamaguiProvider>
  );
}
