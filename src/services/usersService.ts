import api from './api';
import { ApiResponse } from './authService';
import { Curso } from './cursosService';

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  fotoUrl: string | null;
  cursos: Curso[];
}

export const usersService = {
  async getByRole(role: string): Promise<UserDTO[]> {
    const { data } = await api.get<ApiResponse<UserDTO[]>>(`/users?role=${role}`);
    return data.data;
  },

  async getAll(): Promise<UserDTO[]> {
    const { data } = await api.get<ApiResponse<UserDTO[]>>('/users');
    return data.data;
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await api.get<ApiResponse<UserProfile>>('/users/me');
    return data.data;
  },

  async updateMe(payload: { name: string; fotoUrl: string }): Promise<UserProfile> {
    const { data } = await api.put<ApiResponse<UserProfile>>('/users/me', payload);
    return data.data;
  },

  async changePassword(passwordActual: string, passwordNueva: string): Promise<void> {
    await api.put('/users/me/password', { passwordActual, passwordNueva });
  },

  async updateStatus(id: number, status: 'activo' | 'bloqueado'): Promise<void> {
    await api.patch(`/users/${id}/status`, { status });
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
