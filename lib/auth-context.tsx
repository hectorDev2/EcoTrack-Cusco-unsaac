'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, ApiClientError, setToken, clearToken, getToken } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, isLoading: false, error: null });
      return;
    }

    try {
      const user = await api.get<User>('/auth/me', { token });
      setState({ user, isLoading: false, error: null });
    } catch {
      clearToken();
      setState({ user: null, isLoading: false, error: null });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await api.post<{
        user: User;
        accessToken: string;
      }>('/auth/login', { email, password });

      setToken(res.accessToken);
      setState({ user: res.user, isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Error al iniciar sesión';
      setState({ user: null, isLoading: false, error: message });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, isLoading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
