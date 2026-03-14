import api from './api';
import { ApiResponse } from './authService';

export type EstadoSubmission = 'Borrador' | 'Enviada' | 'Calificada';

export interface Submission {
  id: number;
  evaluacionId: number;
  estudianteId: number;
  respuestasJson: string;
  estado: EstadoSubmission;
  intentoNumero: number;
  fechaInicio: string;
  fechaFinalizacion: string | null; // alias de fechaEnvio en el back
  fechaEnvio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  evaluacionId: number;
  estudianteId: number;
  respuestasJson: string;
  estado: EstadoSubmission;
  intentoNumero: number;
}

export const submissionsService = {
  async getAll(): Promise<Submission[]> {
    const { data } = await api.get<ApiResponse<Submission[]>>('/submissions');
    return data.data;
  },

  async getById(id: number): Promise<Submission> {
    const { data } = await api.get<ApiResponse<Submission>>(`/submissions/${id}`);
    return data.data;
  },

  async getByEvaluacion(evaluacionId: number): Promise<Submission[]> {
    const { data } = await api.get<ApiResponse<Submission[]>>(`/submissions/evaluacion/${evaluacionId}`);
    return data.data;
  },

  async getByEstudiante(estudianteId: number): Promise<Submission[]> {
    const { data } = await api.get<ApiResponse<Submission[]>>(`/submissions/estudiante/${estudianteId}`);
    return data.data;
  },

  async create(submission: CreateSubmissionRequest): Promise<Submission> {
    const { data } = await api.post<ApiResponse<Submission>>('/submissions', submission);
    return data.data;
  },

  async update(id: number, submission: Partial<CreateSubmissionRequest>): Promise<Submission> {
    const { data } = await api.put<ApiResponse<Submission>>(`/submissions/${id}`, submission);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/submissions/${id}`);
  },
};
