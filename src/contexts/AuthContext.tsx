'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER';
  name: string;
  email: string;
  department?: string;
  current_semester?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const checkToken = async () => {
      try {
        const savedToken = tokenStorage.get();
        if (savedToken) {
          // Decode token to get user info (basic JWT decode)
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            setUser({
              id: payload.id,
              username: payload.username,
              role: payload.role,
              name: payload.name,
              email: payload.email || '',
              department: payload.department,
              current_semester: payload.current_semester
            });
            setToken(savedToken);
          } else {
            tokenStorage.remove();
          }
        }
      } catch (error) {
        console.error('Invalid token:', error);
        tokenStorage.remove();
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure hydration is complete
    const timer = setTimeout(checkToken, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    tokenStorage.set(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    tokenStorage.remove();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}