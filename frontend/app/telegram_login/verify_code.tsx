import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/common/hooks';
import PageLoading from '@/common/components/page-loading';
import * as telegramApi from '@/services/telegram';
import { TelegramLoginStep } from '@/common/typings/telegram-login';
import type { VerifyCodeStepText } from '@/common/typings/telegram-login';

import TgLoginFormLayout from '@/pages/telegram-login/components/tg-login-form-layout';
import TgLoginCodeStep from '@/pages/telegram-login/components/tg-login-code-step';

export default function VerifyCodeScreen(): ReactNode {
  const router = useRouter();
  const { login } = useAuth();
  const { phoneNumber, phoneCodeHash, pendingSession } = useLocalSearchParams<{
    phoneNumber: string;
    phoneCodeHash: string;
    pendingSession: string;
  }>();

  const [text, setText] = useState<VerifyCodeStepText | null>(null);
  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const data = await telegramApi.fetchTelegramText(
        TelegramLoginStep.VERIFY_CODE,
      );
      if (!cancelled) setText(data);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = async (): Promise<void> => {
    if (!text) return;
    if (!phoneCode.trim()) {
      setError(text.errors.emptyCode);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await telegramApi.signIn(
        phoneNumber ?? '',
        phoneCode,
        phoneCodeHash ?? '',
        pendingSession ?? '',
      );

      if (result.require2FA) {
        router.push({
          pathname: '/telegram_login/verify_2fa',
          params: { session: result.session ?? '' },
        });
        return;
      }

      if (result.success && result.session && result.user) {
        await login(result.session, result.user);
        router.dismissAll();
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : text.errors.signInFail);
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
      <TgLoginCodeStep
        phoneNumber={phoneNumber ?? ''}
        phoneCode={phoneCode}
        onPhoneCodeChange={setPhoneCode}
        onSignIn={() => void handleSignIn()}
        onBack={() => router.back()}
        loading={loading}
        codeSentLabel={text.codeSentLabel}
        codePlaceholder={text.codePlaceholder}
        verifyButtonText={text.verifyButton}
        backLinkText={text.backLink}
      />
    </TgLoginFormLayout>
  );
}
