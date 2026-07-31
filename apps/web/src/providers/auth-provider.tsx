'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authService, MeResponse } from '@/services/auth.service';
import { getToken, setToken, clearToken } from '@/lib/auth-token';

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
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const stored = getToken();
    if (stored) {
      setTokenState(stored);

      setToken(stored);
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
    await fetchMe();
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
