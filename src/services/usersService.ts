import api from './api';
import { ApiResponse } from './authService';

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
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

  async updateStatus(id: number, status: 'activo' | 'bloqueado'): Promise<void> {
    await api.patch(`/users/${id}/status`, { status });
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
