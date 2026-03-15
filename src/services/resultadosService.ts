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

export interface ResultadoDetalle {
  id: number;
  submissionId: number;
  estudianteId?: number;
  estudianteNombre: string;
  estudianteEmail: string;
  documentoEstudiante?: string; // ID o código del estudiante (para procesos administrativos)
  evaluacionId?: number;
  evaluacionNombre: string;
  cursoId?: number;
  cursoNombre: string;
  profesorId?: number;
  profesorNombre: string;
  puntuacionTotal: number;
  puntuacionMaxima: number;
  porcentaje: number;
  notaEscala: number;
  estadoAprobacion: 'Aprobado' | 'Reprobado';
  createdAt: string; // Fecha de entrega de la evaluación
  fechaEntrega?: string; // Fecha de entrega formateada
}

export interface ResumenCurso {
  evaluacionId: number;
  evaluacionNombre: string;
  promedioGrupo: number;
  promedioEscala: number;
  totalEstudiantes: number;
  aprobados: number;
  reprobados: number;
}

export const resultadosService = {
  async getMisResultados(): Promise<ResultadoDetalle[]> {
    const { data } = await api.get<ApiResponse<ResultadoDetalle[]>>('/resultados/mis-resultados');
    return data.data;
  },

  async getByEvaluacion(evaluacionId: number): Promise<Resultado[]> {
    const { data } = await api.get<ApiResponse<Resultado[]>>(`/resultados/evaluacion/${evaluacionId}`);
    return data.data;
  },

  async getByCurso(cursoId: number): Promise<ResultadoDetalle[]> {
    const { data } = await api.get<ApiResponse<ResultadoDetalle[]>>(`/resultados/curso/${cursoId}`);
    return data.data;
  },

  async getResumenCurso(cursoId: number): Promise<ResumenCurso[]> {
    const { data } = await api.get<ApiResponse<ResumenCurso[]>>(`/resultados/curso/${cursoId}/resumen`);
    return data.data;
  },
};
