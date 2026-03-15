import api from './api';
import { ApiResponse } from './authService';

export type TipoPQRS = 'Petición' | 'Queja' | 'Reclamo' | 'Sugerencia';
export type EstadoPQRS = 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cerrada';

export interface PQRS {
  id: number;
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  estado: EstadoPQRS;
  usuarioId: number;
  cursoId: number | null;
  respuesta: string | null;
  respondidoPorId: number | null;
  fechaCreacion: string;
  fechaRespuesta: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePQRSRequest {
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  cursoId?: number;
}

export interface ResponderPQRSRequest {
  respuesta: string;
  estado: EstadoPQRS;
}

export const pqrsService = {
  async getAll(): Promise<PQRS[]> {
    const { data } = await api.get<ApiResponse<PQRS[]>>('/pqrs');
    return data.data;
  },

  async getById(id: number): Promise<PQRS> {
    const { data } = await api.get<ApiResponse<PQRS>>(`/pqrs/${id}`);
    return data.data;
  },

  async getMisPQRS(): Promise<PQRS[]> {
    const { data } = await api.get<ApiResponse<PQRS[]>>('/pqrs/mis-pqrs');
    return data.data;
  },

  async getByEstado(estado: EstadoPQRS): Promise<PQRS[]> {
    const { data } = await api.get<ApiResponse<PQRS[]>>(`/pqrs/estado/${estado}`);
    return data.data;
  },

  async create(pqrs: CreatePQRSRequest): Promise<PQRS> {
    try {
      const { data } = await api.post<ApiResponse<PQRS>>('/pqrs', pqrs);
      return data.data;
    } catch (err: any) {
      // Log detallado para diagnóstico
      console.group('[pqrsService.create] Error');
      console.log('Status:', err?.response?.status);
      console.log('Body:', err?.response?.data);
      console.log('Message:', err?.message);
      console.groupEnd();

      // Si el backend devolvió el objeto creado dentro del error (serialización parcial)
      const responseData = err?.response?.data;
      if (responseData && typeof responseData === 'object' && 'id' in responseData) {
        return responseData as PQRS;
      }
      // Si data.data existe (wrapper ApiResponse)
      if (responseData?.data && typeof responseData.data === 'object' && 'id' in responseData.data) {
        return responseData.data as PQRS;
      }
      throw err;
    }
  },

  async update(id: number, pqrs: Partial<CreatePQRSRequest>): Promise<PQRS> {
    const { data } = await api.put<ApiResponse<PQRS>>(`/pqrs/${id}`, pqrs);
    return data.data;
  },

  async responder(id: number, respuesta: ResponderPQRSRequest): Promise<PQRS> {
    const { data } = await api.put<ApiResponse<PQRS>>(`/pqrs/${id}/responder`, respuesta);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/pqrs/${id}`);
  },
};
