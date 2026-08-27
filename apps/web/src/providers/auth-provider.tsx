'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { authService, MeResponse } from '@/services/auth.service';
import { getToken, setToken, clearToken } from '@/lib/auth-token';
import { useFetchData } from '@/core/api/query';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: MeResponse | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useFetchData<MeResponse>({
    queryKey: ['auth', 'me', token],
    request: () => authService.getMe(),
    options: {
      enabled: !!token,
      staleTime: 300_000,
    },
  });

  const login = useCallback(async (newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  }, [queryClient]);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    queryClient.setQueryData(['auth', 'me', token], null);
  }, [queryClient, token]);

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading: !!token && isLoading,
  }), [user, token, login, logout, isLoading]);

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
