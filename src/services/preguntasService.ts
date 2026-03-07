import api from './api';
import { ApiResponse } from './authService';

export type TipoPregunta = 'seleccion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'ensayo';

export interface Pregunta {
  id: number;
  evaluacionId: number;
  enunciado: string;
  tipo: TipoPregunta;
  puntuacion: number;
  orden: number;
  opcionesJson: string;
  respuestaCorrectaJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePreguntaRequest {
  evaluacionId: number;
  enunciado: string;
  tipo: TipoPregunta;
  puntuacion: number;
  orden: number;
  opcionesJson: string;
  respuestaCorrectaJson: string;
}

export const preguntasService = {
  async getAll(): Promise<Pregunta[]> {
    const { data } = await api.get<ApiResponse<Pregunta[]>>('/preguntas');
    return data.data;
  },

  async getById(id: number): Promise<Pregunta> {
    const { data } = await api.get<ApiResponse<Pregunta>>(`/preguntas/${id}`);
    return data.data;
  },

  async getByEvaluacion(evaluacionId: number): Promise<Pregunta[]> {
    const { data } = await api.get<ApiResponse<Pregunta[]>>(`/preguntas/evaluacion/${evaluacionId}`);
    return data.data;
  },

  async create(pregunta: CreatePreguntaRequest): Promise<Pregunta> {
    const { data } = await api.post<ApiResponse<Pregunta>>('/preguntas', pregunta);
    return data.data;
  },

  async update(id: number, pregunta: Partial<CreatePreguntaRequest>): Promise<Pregunta> {
    const { data } = await api.put<ApiResponse<Pregunta>>(`/preguntas/${id}`, pregunta);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/preguntas/${id}`);
  },
};
