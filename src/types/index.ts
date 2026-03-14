/**
 * Tipos compartidos de la aplicación
 */

export type EstadoEvaluacion = 'Activa' | 'Cerrada' | 'Programada' | 'Borrador';
export type TipoEvaluacion = 'Examen' | 'Quiz' | 'Taller' | 'Proyecto' | 'Tarea';
export type EstadoPQRS = 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cerrada';
export type TipoPQRS = 'Petición' | 'Queja' | 'Reclamo' | 'Sugerencia';

export interface Evaluacion {
  id: number;
  name: string;
  curso: string;       // nombre/codigo del curso (para mostrar)
  cursoId: number;     // id del curso (para filtrar)
  profesor?: string;
  deadline: string;
  estado: EstadoEvaluacion;
  tipo: TipoEvaluacion;
  intentos?: number;
  duracion?: string;
  pendientes?: number;
}

export interface Curso {
  id: number;
  codigo: string;
  nombre: string;
  progreso: number;
  proxEval?: string;
  evalDate?: string;
}

export interface Estadistica {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

export interface TicketPQRS {
  id: number;
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  estado: EstadoPQRS;
  fechaCreacion: string;
  createdAt: string;
  curso: string;
  respuesta?: string | null;
}

