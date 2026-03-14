import api from './api';
import { ApiResponse } from './authService';

export interface Resultado {
  id: number;
  submissionId: number;
  evaluacionId?: number;
  estudianteId?: number;
  puntuacionTotal: number;
  puntuacionMaxima: number;
  porcentaje: number;
  createdAt: string;
}

export const resultadosService = {
  async getMisResultados(): Promise<Resultado[]> {
    const { data } = await api.get<ApiResponse<Resultado[]>>('/resultados/mis-resultados');
    return data.data;
  },

  async getByEvaluacion(evaluacionId: number): Promise<Resultado[]> {
    const { data } = await api.get<ApiResponse<Resultado[]>>(`/resultados/evaluacion/${evaluacionId}`);
    return data.data;
  },
};
