import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, Text, Spacer } from 'tamagui';
import { useAuth } from '@/common/hooks';
import * as telegramApi from '@/service/telegram';
import { TelegramLoginStep } from '@/common/typings/telegram-login';

import TwoFAStep from '@/components/telegramLogin/tl-two-FA-step';
import usePageData from '@/hooks/usePageData';

export default function Verify2FAScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { session } = useLocalSearchParams<{ session: string }>();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: text } = usePageData(
    () => telegramApi.fetchTelegramText(TelegramLoginStep.VERIFY_2FA),
    [],
  );

  const handleCheckPassword = async () => {
    if (!text) return;
    if (!password.trim()) {
      setError(text.errors.emptyPassword);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.checkPassword(session!, password);
      if (result.success) {
        await login(result.session, result.user);
        router.dismissAll();
        router.back();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : text.errors.checkPasswordFail,
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while fetching text
  if (!text) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
                {text.title}
              </Text>
              <Text fontSize="$3" color="$gray11" mt="$2">
                {text.subtitle}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text color="$red11" fontSize="$2">
                  {error}
                </Text>
              </View>
            ) : null}

            <TwoFAStep
              password={password}
              onPasswordChange={setPassword}
              onCheckPassword={handleCheckPassword}
              loading={loading}
              passwordPlaceholder={text.passwordPlaceholder}
              confirmButtonText={text.confirmButton}
            />

            <Spacer flex={1} />
          </YStack>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
