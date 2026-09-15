import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SignupInput, User } from '@/types';
import { authenticate, clearAuthToken, signup } from '@/data/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (input: SignupInput) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'apex-energy-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const matched = await authenticate(email, password);
      if (matched) { setUser(matched); localStorage.setItem(STORAGE_KEY, JSON.stringify(matched)); return true; }
      setError('Invalid email or password. Please try again.'); return false;
    } catch { setError('Unable to reach authentication service.'); return false; }
    finally { setLoading(false); }
  }, []);

  const handleSignup = useCallback(async (input: SignupInput) => {
    setLoading(true); setError(null);
    try {
      const newUser = await signup(input);
      setUser(newUser); localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed.'); return false;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => { setUser(null); localStorage.removeItem(STORAGE_KEY); clearAuthToken(); }, []);

  const value = useMemo(() => ({ user, loading, error, login, signup: handleSignup, logout }), [user, loading, error, login, handleSignup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
