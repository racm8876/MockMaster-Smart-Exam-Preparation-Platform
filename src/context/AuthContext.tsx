import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; confirmPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  claimDailyBonus: () => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  // The JWT is stored only in an HttpOnly cookie. This sentinel keeps the
  // existing authenticated-request checks without exposing a credential to JS.
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<'en' | 'hi'>(() => {
    return (localStorage.getItem('mockmaster_lang') as 'en' | 'hi') || 'en';
  });

  const setLanguage = useCallback((lang: 'en' | 'hi') => {
    setLanguageState(lang);
    localStorage.setItem('mockmaster_lang', lang);
    if (token) {
      fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferredLanguage: lang }),
      }).catch(() => {});
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.preferredLanguage) {
          setLanguageState(data.user.preferredLanguage);
          localStorage.setItem('mockmaster_lang', data.user.preferredLanguage);
        }
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken('session');
        setUser(data.user);
        if (data.user.preferredLanguage) {
          setLanguageState(data.user.preferredLanguage);
          localStorage.setItem('mockmaster_lang', data.user.preferredLanguage);
        }
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred.' };
    }
  };

  const register = async (formData: { name: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, preferredLanguage: language }),
      });
      const data = await res.json();
      if (data.success) {
        setToken('session');
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
    setUser(null);
  };

  const claimDailyBonus = async () => {
    if (!token) return { success: false };
    try {
      const res = await fetch('/api/rewards/daily-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        if (user) {
          setUser({
            ...user,
            stats: {
              ...user.stats,
              streakDays: data.streakDays,
              points: data.points,
            },
          });
        }
        return { success: true, message: data.message };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        language,
        setLanguage,
        isLoading,
        login,
        register,
        logout,
        claimDailyBonus,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
