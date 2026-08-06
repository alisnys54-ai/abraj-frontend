'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiErrorMessage } from '@/lib/api-client';
import { tokenStore } from '@/lib/token-store';
import type { MeProfile } from '@/lib/schemas/misc';
import { disconnectNotificationsSocket, getNotificationsSocket } from '@/lib/socket';

interface AuthContextValue {
  user: MeProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ forcePasswordChange: boolean }>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get<MeProfile>('/me');
      setUser(res.data);
      getNotificationsSocket();
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (tokenStore.getAccess()) await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post('/auth/login', { email, password });
      tokenStore.set(res.data.access_token, res.data.refresh_token);
      await fetchMe();
      return { forcePasswordChange: !!res.data.force_password_change };
    },
    [fetchMe],
  );

  const logout = useCallback(async () => {
    const refresh_token = tokenStore.getRefresh();
    try {
      if (refresh_token) await api.post('/auth/logout', { refresh_token });
    } catch {
      /* best-effort */
    }
    tokenStore.clear();
    disconnectNotificationsSocket();
    setUser(null);
    router.push('/login');
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, login, logout, refetchMe: fetchMe }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { apiErrorMessage };
