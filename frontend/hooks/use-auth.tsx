import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "telegram_session";
const USER_KEY = "telegram_user";

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
}

interface AuthContextValue {
  session: string | null;
  user: TelegramUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (session: string, user: TelegramUser) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Storage helpers ───────────────────────────────────────────────

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ─── Context ───────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider component — wrap your root layout with this.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
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
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (newSession: string, newUser: TelegramUser) => {
      await setItem(SESSION_KEY, newSession);
      await setItem(USER_KEY, JSON.stringify(newUser));
      setSession(newSession);
      setUser(newUser);
    },
    []
  );

  const logout = useCallback(async () => {
    await deleteItem(SESSION_KEY);
    await deleteItem(USER_KEY);
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoggedIn: !!session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state — must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
