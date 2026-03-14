import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';
import { authService } from '../services/authService';

export type UserRole = 'maestro' | 'estudiante' | 'coordinador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'quimbayaeval_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEY, null);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await authService.login(email, password, role);
      
      const userData: User = {
        id: String(response.id),
        name: response.name,
        email: response.email,
        role: response.role,
      };
      
      setUser(userData);
      toast.success(`Bienvenido, ${userData.name}`, {
        description: `Has iniciado sesión como ${role}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error('Error de autenticación', {
        description: message,
      });
      throw error;
    }
  };

  const logout = () => {
    const userName = user?.name || 'Usuario';
    authService.logout();
    setUser(null);
    toast.info('Sesión cerrada', {
      description: `Hasta luego, ${userName}`,
    });
  };

  const updateUser = (partial: Partial<User>) => {
    if (user) setUser({ ...user, ...partial });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
