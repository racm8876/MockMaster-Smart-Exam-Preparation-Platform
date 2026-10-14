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
  switchRoleDemo: (role: 'ADMIN' | 'STUDENT') => Promise<void>;
  claimDailyBonus: () => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mockmaster_jwt'));
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredLanguage: lang }),
      }).catch(() => {});
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('mockmaster_jwt');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.preferredLanguage) {
          setLanguageState(data.user.preferredLanguage);
          localStorage.setItem('mockmaster_lang', data.user.preferredLanguage);
        }
      } else {
        localStorage.removeItem('mockmaster_jwt');
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
        localStorage.setItem('mockmaster_jwt', data.token);
        setToken(data.token);
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
        localStorage.setItem('mockmaster_jwt', data.token);
        setToken(data.token);
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
    localStorage.removeItem('mockmaster_jwt');
    setToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (role: 'ADMIN' | 'STUDENT') => {
    try {
      const res = await fetch('/api/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mockmaster_jwt', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } catch (err) {
      console.error('Demo switch error', err);
    }
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
        switchRoleDemo,
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
