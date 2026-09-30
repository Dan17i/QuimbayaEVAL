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
  cursoId: number;
  destinatario?: 'maestro' | 'coordinador';
}

export interface ResponderPQRSRequest {
  respuesta: string;
  estado: EstadoPQRS;
}

export interface PQRSDetalle {
  id: number;
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  cursoId: number | null;
  cursoNombre: string | null;
  cursoCodigo: string | null;
  usuarioId: number;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  estado: EstadoPQRS;
  destinatario: string | null;
  fechaCreacion: string;
  fechaRespuesta: string | null;
  respuesta: string | null;
  respondidoPorId: number | null;
  respondidoPorNombre: string | null;
  diasTranscurridos: number;
  enPlazo: boolean;
  estadoSLA: 'A_TIEMPO' | 'PROXIMO_A_VENCER' | 'VENCIDO' | 'ATENDIDO_A_TIEMPO' | 'ATENDIDO_FUERA_DE_PLAZO';
  createdAt: string;
  updatedAt: string;
}

export const pqrsService = {
  async getAll(): Promise<PQRS[]> {
    const { data } = await api.get<ApiResponse<PQRS[]>>('/pqrs');
    return data.data;
  },

  async getDetalles(): Promise<PQRSDetalle[]> {
    const { data } = await api.get<ApiResponse<PQRSDetalle[]>>('/pqrs/detalles');
    return data.data;
  },

  async getById(id: number): Promise<PQRS> {
    const { data } = await api.get<ApiResponse<PQRS>>(`/pqrs/${id}`);
    return data.data;
  },

  async getDetalleById(id: number): Promise<PQRSDetalle> {
    const { data } = await api.get<ApiResponse<PQRSDetalle>>(`/pqrs/${id}/detalle`);
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
    const { data } = await api.post<ApiResponse<PQRS>>('/pqrs', pqrs);
    return data.data;
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

  async cambiarEstado(id: number, estado: EstadoPQRS): Promise<PQRS> {
    try {
      const { data } = await api.put<ApiResponse<PQRS>>(`/pqrs/${id}/estado`, { estado });
      return data.data;
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? 'Error al cambiar el estado';
      throw new Error(msg);
    }
  },
};
