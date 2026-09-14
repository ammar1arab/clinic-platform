'use client';

import { createContext, useContext, useMemo, useCallback, useSyncExternalStore } from 'react';
import { authService, MeResponse } from '@/services/auth.service';
import { getToken, setToken, clearToken, subscribeToToken, getServerTokenSnapshot } from '@/lib/auth-token';
import { createLogger } from '@/lib/logger';
import { useFetchData } from '@/hooks/query/use-fetch-data';
import { useMounted } from '@/hooks/shared/use-mounted';
import { useQueryClient } from '@tanstack/react-query';

const log = createLogger('auth');

interface AuthContextType {
  user: MeResponse | null;
  token: string | null;
  login: (token: string) => Promise<MeResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useMounted();
  const token = useSyncExternalStore(subscribeToToken, getToken, getServerTokenSnapshot);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useFetchData<MeResponse>({
    queryKey: ['auth', 'me', token],
    request: () => authService.getMe(),
    options: {
      enabled: isHydrated && !!token,
      staleTime: 300_000,
    },
  });

  const login = useCallback(async (newToken: string) => {
    setToken(newToken);
    const me = await authService.getMe();
    queryClient.setQueryData(['auth', 'me', newToken], me);
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
    log.info('login');
    return me;
  }, [queryClient]);

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
    log.info('logout');
  }, [queryClient]);

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading: !!token && isLoading,
    isHydrated,
  }), [user, token, login, logout, isLoading, isHydrated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
