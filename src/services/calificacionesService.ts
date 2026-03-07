import api from './api';
import { ApiResponse } from './authService';

export interface Calificacion {
  id: number;
  submissionId: number;
  puntuacionObtenida: number;
  puntuacionMaxima: number;
  retroalimentacion: string;
  calificadoPorId: number;
  fechaCalificacion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalificacionRequest {
  submissionId: number;
  puntuacionObtenida: number;
  puntuacionMaxima: number;
  retroalimentacion: string;
  calificadoPorId: number;
}

export const calificacionesService = {
  async getAll(): Promise<Calificacion[]> {
    const { data } = await api.get<ApiResponse<Calificacion[]>>('/calificaciones');
    return data.data;
  },

  async getById(id: number): Promise<Calificacion> {
    const { data } = await api.get<ApiResponse<Calificacion>>(`/calificaciones/${id}`);
    return data.data;
  },

  async getBySubmission(submissionId: number): Promise<Calificacion[]> {
    const { data } = await api.get<ApiResponse<Calificacion[]>>(`/calificaciones/submission/${submissionId}`);
    return data.data;
  },

  async create(calificacion: CreateCalificacionRequest): Promise<Calificacion> {
    const { data } = await api.post<ApiResponse<Calificacion>>('/calificaciones', calificacion);
    return data.data;
  },

  async update(id: number, calificacion: Partial<CreateCalificacionRequest>): Promise<Calificacion> {
    const { data } = await api.put<ApiResponse<Calificacion>>(`/calificaciones/${id}`, calificacion);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/calificaciones/${id}`);
  },
};
