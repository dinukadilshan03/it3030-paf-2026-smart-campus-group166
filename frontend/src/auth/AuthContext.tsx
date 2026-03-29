import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../services/authService';
import type { LoginRequest, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    const response = await getCurrentUser();
    setUser(response.authenticated ? response.user : null);
  };

  useEffect(() => {
    refreshSession()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (request: LoginRequest) => {
    const response = await loginRequest(request);
    setUser(response.user);
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
