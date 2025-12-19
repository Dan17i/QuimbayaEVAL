import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';

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
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'quimbayaeval_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEY, null);

  const login = async (email: string, password: string, role: UserRole) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Login directo sin validación (prototipo)
    const mockUser: User = {
      id: `${role}-001`,
      name: role === 'maestro' ? 'Prof. Juan García' : role === 'estudiante' ? 'Ana López' : 'Dr. Carlos Méndez',
      email: email || `${role}@universidad.edu`,
      role,
    };
    
    setUser(mockUser);
    toast.success(`Bienvenido, ${mockUser.name}`, {
      description: `Has iniciado sesión como ${role}`,
    });
  };

  const logout = () => {
    const userName = user?.name || 'Usuario';
    setUser(null);
    toast.info('Sesión cerrada', {
      description: `Hasta luego, ${userName}`,
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
