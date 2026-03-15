/**
 * Rutas de la aplicación
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/',
  
  // Rutas de Estudiante
  MIS_CURSOS: '/mis-cursos',
  CURSO_DETALLE: '/mis-cursos/:id',
  MIS_EVALUACIONES: '/mis-evaluaciones',
  REALIZAR_EVALUACION: '/realizar-evaluacion',
  HISTORIAL: '/historial',
  
  // Rutas de Maestro
  EVALUACIONES: '/evaluaciones',
  CREAR_EVALUACION: '/evaluaciones/nueva',
  CALIFICAR: '/calificar',
  REPORTES: '/reportes',
  MIS_CURSOS_MAESTRO: '/mis-cursos-maestro',
  CURSO_MAESTRO_DETALLE: '/mis-cursos-maestro/:id',
  
  // Rutas de Coordinador
  USUARIOS: '/usuarios',
  CURSOS: '/cursos',
  
  // Rutas Comunes
  PQRS: '/pqrs',
  PERFIL: '/perfil',
} as const;

