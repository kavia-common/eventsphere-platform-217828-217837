import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Navigate, useLocation } from 'react-router-dom';
import { ME_QUERY } from '../graphql/queries';

const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * Provides auth state and actions (login/logout) to the app.
 * - Persists token in localStorage as 'auth_token'
 * - Exposes user data from a minimal Me query
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token') || '';
    } catch {
      return '';
    }
  });

  const { data, refetch } = useQuery(ME_QUERY, {
    skip: !token, // skip if no token
    fetchPolicy: 'cache-and-network',
  });

  // Keep token in local storage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch {
      // no-op
    }
  }, [token]);

  // PUBLIC_INTERFACE
  const login = useCallback(async (newToken) => {
    /**
     * Perform your real login flow elsewhere, then call login(newToken).
     * After setting token, we refetch 'me' to populate user context.
     */
    setToken(newToken);
    // Refetch me after token update (slight delay to allow link header usage)
    setTimeout(() => {
      refetch?.();
    }, 0);
  }, [refetch]);

  // PUBLIC_INTERFACE
  const logout = useCallback(() => {
    setToken('');
  }, []);

  const value = useMemo(
    () => ({
      token,
      user: data?.me || null,
      isAuthenticated: Boolean(token && data?.me),
      login,
      logout,
      refetchMe: refetch,
    }),
    [token, data, login, logout, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access authentication context.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Route guard: renders children if authenticated, else redirects to '/'.
 * Optionally, pass 'to' to change destination; preserves 'from' in state.
 */
export function ProtectedRoute({ children, to = '/' }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={to} replace state={{ from: location }} />;
  }
  return children;
}

export default AuthProvider;
