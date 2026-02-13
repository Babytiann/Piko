import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { TelegramUser } from '@/common/typings/telegram-login';
import { createSafeContext } from '@/contexts/pageBaseContext';

const SESSION_KEY = 'telegram_session';
const USER_KEY = 'telegram_user';

export type { TelegramUser };

export interface AuthContextValue {
  session: string | null;
  user: TelegramUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (session: string, user: TelegramUser) => Promise<void>;
  logout: () => Promise<void>;
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const [AuthProvider, useAuth] =
  createSafeContext<AuthContextValue>('Auth');

export function useAuthValue(): AuthContextValue {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedSession = await getItem(SESSION_KEY);
        const storedUser = await getItem(USER_KEY);
        if (storedSession) {
          setSession(storedSession);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (newSession: string, newUser: TelegramUser): Promise<void> => {
      await setItem(SESSION_KEY, newSession);
      await setItem(USER_KEY, JSON.stringify(newUser));
      setSession(newSession);
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await deleteItem(SESSION_KEY);
    await deleteItem(USER_KEY);
    setSession(null);
    setUser(null);
  }, []);

  return {
    session,
    user,
    isLoggedIn: !!session,
    isLoading,
    login,
    logout,
  };
}
