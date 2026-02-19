import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/common/hooks';
import PageLoading from '@/common/components/page-loading';
import * as telegramApi from '@/services/telegram';
import { TelegramLoginStep } from '@/common/typings/telegram-login';
import type { VerifyTwoFAStepText } from '@/common/typings/telegram-login';

import TgLoginFormLayout from '@/pages/telegram-login/components/tg-login-form-layout';
import TgLoginTwoFaStep from '@/pages/telegram-login/components/tg-login-two-fa-step';

export default function Verify2FAScreen(): ReactNode {
  const router = useRouter();
  const { login } = useAuth();
  const { session } = useLocalSearchParams<{ session: string }>();

  const [text, setText] = useState<VerifyTwoFAStepText | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const data = await telegramApi.fetchTelegramText(
        TelegramLoginStep.VERIFY_2FA,
      );
      if (!cancelled) setText(data);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheckPassword = async (): Promise<void> => {
    if (!text) return;
    if (!password.trim()) {
      setError(text.errors.emptyPassword);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.checkPassword(session ?? '', password);
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

  if (!text) {
    return <PageLoading />;
  }

  return (
    <TgLoginFormLayout
      title={text.title}
      subtitle={text.subtitle}
      error={error}
    >
      <TgLoginTwoFaStep
        password={password}
        onPasswordChange={setPassword}
        onCheckPassword={() => void handleCheckPassword()}
        loading={loading}
        passwordPlaceholder={text.passwordPlaceholder}
        confirmButtonText={text.confirmButton}
      />
    </TgLoginFormLayout>
  );
}
