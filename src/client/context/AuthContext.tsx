import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types/fintech.js';
import {
  loginApi,
  logoutApi,
  fetchCurrentUser,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  ApiRequestError,
} from '../services/api.js';

interface AuthContextType {
  user: AuthUser | null;
  role: 'ADMIN' | 'MERCHANT' | 'OPERATOR' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearSessionExpired: () => void;
  isAdmin: boolean;
  isMerchant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        if (getStoredToken()) {
          const currentUser = await fetchCurrentUser();
          if (isMounted) setUser(currentUser);
        }
      } catch (err) {
        if (isMounted && err instanceof ApiRequestError && err.status !== 401) {
          setAuthError('Could not verify the saved session. Check the server and database configuration.');
        } else if (isMounted && !(err instanceof ApiRequestError)) {
          setAuthError('Could not verify the saved session. Check your connection and try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen to session expired events from api.ts
    const handleExpired = () => {
      setUser(null);
      setSessionExpired(true);
      setAuthError(null);
    };

    window.addEventListener('escrow:session_expired', handleExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('escrow:session_expired', handleExpired);
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await loginApi(email, pass);
      setStoredToken(result.token);
      setUser(result.user);
      setSessionExpired(false);
      setAuthError(null);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      removeStoredToken();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const isMerchant = user?.role === 'MERCHANT';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role as 'ADMIN' | 'MERCHANT' | 'OPERATOR' | null,
        isAuthenticated: !!user,
        isLoading,
        sessionExpired,
        authError,
        login,
        logout,
        clearSessionExpired,
        isAdmin,
        isMerchant,
      }}
    >
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
