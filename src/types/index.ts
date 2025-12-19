/**
 * Tipos compartidos de la aplicación
 */

export type EstadoEvaluacion = 'Activa' | 'Cerrada' | 'Programada' | 'Borrador';
export type TipoEvaluacion = 'Examen' | 'Quiz' | 'Taller' | 'Proyecto' | 'Tarea';
export type EstadoPQRS = 'Pendiente' | 'En Proceso' | 'Resuelto';
export type TipoPQRS = 'Pregunta' | 'Reclamo' | 'Sugerencia' | 'Queja';

export interface Evaluacion {
  id: number;
  name: string;
  curso: string;
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
  fecha: string;
  curso: string;
  respuesta?: string | null;
}

