import api from './api';
import { ApiResponse } from './authService';
import { UserDTO } from './usersService';

export interface Curso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  profesorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCursoRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  profesorId: number;
}

export const cursosService = {
  async getAll(): Promise<Curso[]> {
    const { data } = await api.get<ApiResponse<Curso[]>>('/cursos');
    return data.data;
  },

  async getById(id: number): Promise<Curso> {
    const { data } = await api.get<ApiResponse<Curso>>(`/cursos/${id}`);
    return data.data;
  },

  async getByProfesor(profesorId: number): Promise<Curso[]> {
    const { data } = await api.get<ApiResponse<Curso[]>>(`/cursos/profesor/${profesorId}`);
    return data.data;
  },

  async create(curso: CreateCursoRequest): Promise<Curso> {
    const { data } = await api.post<ApiResponse<Curso>>('/cursos', curso);
    return data.data;
  },

  async update(id: number, curso: Partial<CreateCursoRequest>): Promise<Curso> {
    const { data } = await api.put<ApiResponse<Curso>>(`/cursos/${id}`, curso);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/cursos/${id}`);
  },

  async getEstudiantes(cursoId: number): Promise<UserDTO[]> {
    const { data } = await api.get<ApiResponse<UserDTO[]>>(`/cursos/${cursoId}/estudiantes`);
    return data.data;
  },

  async matricularEstudiante(cursoId: number, estudianteId: number): Promise<void> {
    await api.post(`/cursos/${cursoId}/estudiantes`, { estudianteId });
  },

  async desmatricularEstudiante(cursoId: number, estudianteId: number): Promise<void> {
    await api.delete(`/cursos/${cursoId}/estudiantes/${estudianteId}`);
  },
};
