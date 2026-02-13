import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
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
            <View style={styles.headerCenter}>
              <Text fontSize={24} fontWeight="700" color="$color">
                {title}
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                {subtitle}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            {children}

            <Spacer flex={1} />
          </YStack>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
});
