import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, Text, Spacer } from 'tamagui';

interface TgLoginFormLayoutProps {
  title: string;
  subtitle: string;
  error: string;
  children: ReactNode;
}

export default function TgLoginFormLayout({
  title,
  subtitle,
  error,
  children,
}: TgLoginFormLayoutProps): ReactNode {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <YStack flex={1} pt={top} pb={bottom} px="$6" bg="$background">
            <YStack mb="$5" style={{ alignItems: 'center' }}>
              <Text fontSize={24} fontWeight="700" color="$color">
                {title}
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                {subtitle}
              </Text>
            </YStack>

            {error ? (
              <YStack
                bg="$red2"
                px="$3"
                py="$2"
                mb="$3"
                style={{ borderRadius: 8 }}
              >
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </YStack>
            ) : null}

            {children}

            <Spacer flex={1} />
          </YStack>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
