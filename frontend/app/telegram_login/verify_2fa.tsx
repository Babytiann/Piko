import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/common/hooks';
import PageLoading from '@/common/components/page-loading';
import { HttpError } from '@/services';
import * as telegramApi from '@/services/telegram';
import { TelegramLoginStep } from '@/common/typings/telegram-login';
import type { VerifyTwoFAStepText } from '@/common/typings/telegram-login';

import TgLoginFormLayout from '@/pages/telegram-login/components/tg-login-form-layout';
import TgLoginTwoFaStep from '@/pages/telegram-login/components/tg-login-two-fa-step';

export default function Verify2FAScreen(): ReactNode {
  const router = useRouter();
  const { login } = useAuth();
  const { session, prefetchedTextJson } = useLocalSearchParams<{
    session: string;
    prefetchedTextJson?: string;
  }>();

  const [text, setText] = useState<VerifyTwoFAStepText | null>(() => {
    if (prefetchedTextJson) {
      try {
        return JSON.parse(prefetchedTextJson) as VerifyTwoFAStepText;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 已有预取数据则跳过请求
    if (text) return;
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
  }, [text]);

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
      if (err instanceof HttpError && err.status === 409) {
        setError('该账户已被绑定');
      } else {
        setError(
          err instanceof Error ? err.message : text.errors.checkPasswordFail,
        );
      }
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
