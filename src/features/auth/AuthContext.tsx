import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearSession, setAccessToken, setRefreshToken } from '@/src/lib/auth-token';
import { onConnectionRestored } from '@/src/lib/network';
import { readStoredSession, writeStoredSession } from '@/src/lib/secure-session';
import { markSessionHydrated } from '@/src/lib/session-hydration';
import { setSessionInvalidatedListener } from '@/src/lib/session-invalidated';

import { authService } from './auth.service';

type AuthContextValue = {
  /** Access token when logged in (mirrors SecureStore after hydration). */
  token: string | null;
  /** True until SecureStore has been read on cold start. */
  isLoading: boolean;
  /** Persist session after a successful login API response. */
  setSession: (access: string, refresh?: string | null) => Promise<void>;
  /** Clears session locally, calls logout API, navigates to login. */
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { access, refresh } = await readStoredSession();
        if (cancelled) return;
        if (access) {
          setAccessToken(access);
          if (refresh) {
            setRefreshToken(refresh);
          }
          setToken(access);
        } else {
          clearSession();
          setToken(null);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setToken(null);
        }
      } finally {
        markSessionHydrated();
        if (!cancelled) {
          setIsLoading(false);
          await SplashScreen.hideAsync();
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionInvalidatedListener(() => {
      setToken(null);
      router.replace('/auth/login');
    });
    return () => setSessionInvalidatedListener(null);
  }, []);

  useEffect(() => {
    return onConnectionRestored(() => {
      if (!token) return;
      void authService.me().catch(() => {});
    });
  }, [token]);

  const setSession = useCallback(async (access: string, refresh?: string | null) => {
    const trimmed = access.trim();
    setAccessToken(trimmed);
    if (refresh?.trim()) {
      setRefreshToken(refresh.trim());
    } else {
      setRefreshToken('');
    }
    await writeStoredSession(trimmed, refresh);
    setToken(trimmed);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    router.replace('/auth/login');
  }, []);

  const value = useMemo(
    () => ({
      token,
      isLoading,
      setSession,
      logout,
    }),
    [token, isLoading, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
