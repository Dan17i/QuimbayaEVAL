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
      // El backend a veces devuelve 500 por error de serialización JPA
      // pero la PQRS sí fue creada. Si la respuesta contiene el objeto, lo usamos.
      const responseData = err?.response?.data;
      if (responseData && typeof responseData === 'object' && 'id' in responseData) {
        return responseData as PQRS;
      }
      // Si el mensaje de error contiene el objeto serializado (como string), lo parseamos
      const msg: string = err?.response?.data?.message ?? err?.message ?? '';
      const match = msg.match(/\[(\{id=\d+.*?\})\]/s);
      if (match) {
        // Construimos un objeto mínimo con el id extraído
        const idMatch = match[1].match(/id=(\d+)/);
        if (idMatch) {
          return { id: Number(idMatch[1]) } as PQRS;
        }
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
