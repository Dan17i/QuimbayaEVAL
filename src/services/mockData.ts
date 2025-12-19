import { Evaluacion, Curso, TicketPQRS, Estadistica, EstadoEvaluacion, TipoEvaluacion } from '../types';
import { BookOpen, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, ClipboardList, BarChart3, MessageSquare } from 'lucide-react';

/**
 * Datos mock para evaluaciones
 */
export const mockEvaluaciones: Evaluacion[] = [
  {
    id: 1,
    name: 'Parcial 1 - Cálculo Integral',
    curso: 'MAT-301',
    profesor: 'Prof. Juan García',
    deadline: '2025-10-20T23:59:00',
    estado: 'Activa',
    tipo: 'Examen',
    intentos: 1,
    duracion: '120 min',
  },
  {
    id: 2,
    name: 'Taller Colaborativo - Física Cuántica',
    curso: 'FIS-401',
    profesor: 'Prof. María Torres',
    deadline: '2025-10-22T18:00:00',
    estado: 'Activa',
    tipo: 'Taller',
    intentos: 3,
    duracion: '90 min',
  },
  {
    id: 3,
    name: 'Quiz 3 - Derivadas',
    curso: 'MAT-301',
    deadline: '2025-10-18T23:59:00',
    estado: 'Cerrada',
    tipo: 'Quiz',
    pendientes: 15,
  },
  {
    id: 4,
    name: 'Taller Grupal - Integrales',
    curso: 'MAT-301',
    deadline: '2025-10-25T23:59:00',
    estado: 'Programada',
    tipo: 'Taller',
  },
  {
    id: 5,
    name: 'Examen Final - Álgebra Lineal',
    curso: 'MAT-205',
    deadline: '2025-11-15T23:59:00',
    estado: 'Borrador',
    tipo: 'Examen',
  },
];

/**
 * Datos mock para cursos
 */
export const mockCursos: Curso[] = [
  { id: 1, codigo: 'MAT-301', nombre: 'Cálculo Integral', progreso: 65, proxEval: 'Parcial 1', evalDate: '2025-10-20' },
  { id: 2, codigo: 'FIS-401', nombre: 'Física Cuántica', progreso: 58, proxEval: 'Taller 3', evalDate: '2025-10-22' },
  { id: 3, codigo: 'PRG-205', nombre: 'Estructuras de Datos', progreso: 72, proxEval: 'Quiz 4', evalDate: '2025-10-25' },
  { id: 4, codigo: 'ING-102', nombre: 'Inglés Técnico II', progreso: 80, proxEval: 'Examen Oral', evalDate: '2025-10-28' },
];

/**
 * Datos mock para tickets PQRS
 */
export const mockTicketsPQRS: TicketPQRS[] = [
  {
    id: 1,
    tipo: 'Pregunta',
    asunto: 'Consulta sobre calificación del Parcial 1',
    descripcion: 'Quisiera revisar los criterios de calificación de la pregunta 3...',
    estado: 'Pendiente',
    fecha: '2025-10-16T14:30:00',
    curso: 'MAT-301',
    respuesta: null,
  },
  {
    id: 2,
    tipo: 'Reclamo',
    asunto: 'Error en tiempo de evaluación',
    descripcion: 'La evaluación se cerró antes del tiempo indicado...',
    estado: 'En Proceso',
    fecha: '2025-10-15T10:15:00',
    curso: 'FIS-401',
    respuesta: 'Estamos revisando los registros del sistema. Te contactaremos pronto.',
  },
  {
    id: 3,
    tipo: 'Sugerencia',
    asunto: 'Mejorar interfaz de calificaciones',
    descripcion: 'Sería útil poder ver el desglose por criterios...',
    estado: 'Resuelto',
    fecha: '2025-10-12T16:45:00',
    curso: 'General',
    respuesta: 'Gracias por tu sugerencia. Hemos implementado esta funcionalidad.',
  },
];

/**
 * Estadísticas para estudiante
 */
export const estadisticasEstudiante: Estadistica[] = [
  { label: 'Cursos Inscritos', value: '6', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Evaluaciones Abiertas', value: '2', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Promedio General', value: '4.2', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Completadas', value: '18', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
];

/**
 * Estadísticas para maestro
 */
export const estadisticasMaestro: Estadistica[] = [
  { label: 'Evaluaciones Activas', value: '5', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Por Calificar', value: '23', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Estudiantes', value: '127', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'PQRS Pendientes', value: '3', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
];

/**
 * Obtiene evaluaciones por estado
 */
export const getEvaluacionesByEstado = (estado: EstadoEvaluacion): Evaluacion[] => {
  return mockEvaluaciones.filter(evaluacion => evaluacion.estado === estado);
};

/**
 * Obtiene evaluaciones abiertas (activas)
 */
export const getEvaluacionesAbiertas = (): Evaluacion[] => {
  return getEvaluacionesByEstado('Activa');
};

/**
 * Obtiene evaluaciones recientes (últimas 5)
 */
export const getEvaluacionesRecientes = (): Evaluacion[] => {
  return mockEvaluaciones.slice(0, 4);
};

