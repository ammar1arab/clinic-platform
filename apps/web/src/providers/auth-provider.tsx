'use client';

import { createContext, useContext, useMemo, useCallback, useSyncExternalStore } from 'react';
import { authService, MeResponse } from '@/services/auth.service';
import {
  getAuthSessionRevision,
  getServerAuthSessionRevision,
  publishAuthSessionChange,
  subscribeToAuthSession,
} from '@/lib/auth-session';
import { createLogger } from '@/lib/logger';
import { useFetchData } from '@/hooks/query/use-fetch-data';
import { useMounted } from '@/hooks/shared/use-mounted';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

const log = createLogger('auth');

interface AuthContextType {
  user: MeResponse | null;
  login: (me?: MeResponse) => Promise<MeResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useMounted();
  const sessionRevision = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionRevision,
    getServerAuthSessionRevision,
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useFetchData<MeResponse | null>({
    queryKey: ['auth', 'me', sessionRevision.revision],
    request: () => authService.getMe(),
    options: {
      enabled: isHydrated && sessionRevision.enabled,
      staleTime: 300_000,
    },
  });

  const login = useCallback(async (me?: MeResponse) => {
    getSocket().disconnect();
    const profile = me ?? (await authService.getMe());
    const revision = publishAuthSessionChange(true);
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
    queryClient.setQueryData(['auth', 'me', revision], profile);
    log.info('login');
    return profile;
  }, [queryClient]);

  const logout = useCallback(() => {
    getSocket().disconnect();
    queryClient.clear();
    const revision = publishAuthSessionChange(false);
    queryClient.setQueryData(['auth', 'me', revision], null);
    void authService.logout().catch(() => undefined);
    log.info('logout');
  }, [queryClient]);

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading: isLoading && !user,
    isHydrated,
  }), [user, login, logout, isLoading, isHydrated]);

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
