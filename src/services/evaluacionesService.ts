import api from './api';
import { ApiResponse } from './authService';

export type TipoEvaluacion = 'Examen' | 'Quiz' | 'Taller' | 'Proyecto' | 'Tarea';
export type EstadoEvaluacion = 'Borrador' | 'Programada' | 'Activa' | 'Cerrada';

export interface Evaluacion {
  id: number;
  nombre: string;
  descripcion: string;
  cursoId: number;
  profesorId: number;
  tipo: TipoEvaluacion;
  estado: EstadoEvaluacion;
  deadline: string | null;
  duracionMinutos: number;
  intentosPermitidos: number;
  publicada: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluacionRequest {
  nombre: string;
  descripcion: string;
  cursoId: number;
  profesorId: number;
  tipo: TipoEvaluacion;
  estado: EstadoEvaluacion;
  deadline?: string;
  duracionMinutos: number;
  intentosPermitidos: number;
  publicada: boolean;
}

export interface EvaluacionFilters {
  estado?: EstadoEvaluacion;
  tipo?: TipoEvaluacion;
  cursoId?: number;
  nombre?: string;
  publicada?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export const evaluacionesService = {
  async getAll(filters?: EvaluacionFilters): Promise<Evaluacion[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const { data } = await api.get<ApiResponse<Evaluacion[]>>(`/evaluaciones?${params}`);
    return data.data;
  },

  async getById(id: number): Promise<Evaluacion> {
    const { data } = await api.get<ApiResponse<Evaluacion>>(`/evaluaciones/${id}`);
    return data.data;
  },

  async getByCurso(cursoId: number): Promise<Evaluacion[]> {
    const { data } = await api.get<ApiResponse<Evaluacion[]>>(`/evaluaciones/curso/${cursoId}`);
    return data.data;
  },

  async getActivas(): Promise<Evaluacion[]> {
    const { data } = await api.get<ApiResponse<Evaluacion[]>>('/evaluaciones/estado/activas');
    return data.data;
  },

  async create(evaluacion: CreateEvaluacionRequest): Promise<Evaluacion> {
    const { data } = await api.post<ApiResponse<Evaluacion>>('/evaluaciones', evaluacion);
    return data.data;
  },

  async update(id: number, evaluacion: Partial<CreateEvaluacionRequest>): Promise<Evaluacion> {
    const { data } = await api.put<ApiResponse<Evaluacion>>(`/evaluaciones/${id}`, evaluacion);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/evaluaciones/${id}`);
  },
};
