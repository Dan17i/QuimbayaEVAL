import api from './api';
import { UserRole } from '../contexts/AuthContext';

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  async login(email: string, password: string, role: UserRole): Promise<AuthResponse> {
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
        email,
        password,
        role,
      });
      
      if (data.success) {
        // Guardar token
        localStorage.setItem('quimbayaeval_token', data.data.token);
        return data.data;
      }
      
      throw new Error(data.message || 'Error en login');
    } catch (error: any) {
      // Mejorar mensajes de error
      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado.');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
      
      if (data.success) {
        localStorage.setItem('quimbayaeval_token', data.data.token);
        return data.data;
      }
      
      throw new Error(data.message || 'Error en registro');
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('El email ya está registrado.');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('No se pudo conectar con el servidor.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('quimbayaeval_token');
    localStorage.removeItem('quimbayaeval_user');
  },
};
