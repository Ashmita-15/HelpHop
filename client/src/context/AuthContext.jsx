import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` is true until we know whether the stored token is still valid,
  // so protected routes don't redirect on a hard refresh.
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    api
      .me()
      .then(({ user: u }) => !cancelled && setUser(u))
      .catch(() => clearToken())
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuth = useCallback(({ token, user: u }) => {
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(
    async (credentials) => handleAuth(await api.login(credentials)),
    [handleAuth]
  );

  const register = useCallback(
    async (payload) => handleAuth(await api.register(payload)),
    [handleAuth]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isVolunteer: user?.role === 'volunteer',
      isOrganization: user?.role === 'organization',
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
