/**
 * Rutas de la aplicación
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/',
  
  // Rutas de Estudiante
  MIS_CURSOS: '/mis-cursos',
  MIS_EVALUACIONES: '/mis-evaluaciones',
  REALIZAR_EVALUACION: '/realizar-evaluacion',
  HISTORIAL: '/historial',
  
  // Rutas de Maestro
  EVALUACIONES: '/evaluaciones',
  CREAR_EVALUACION: '/evaluaciones/nueva',
  CALIFICAR: '/calificar',
  REPORTES: '/reportes',
  
  // Rutas de Coordinador
  USUARIOS: '/usuarios',
  
  // Rutas Comunes
  PQRS: '/pqrs',
} as const;

