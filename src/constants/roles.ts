import { UserRole } from '../contexts/AuthContext';

/**
 * Roles del sistema
 */
export const ROLES = {
  ESTUDIANTE: 'estudiante' as UserRole,
  MAESTRO: 'maestro' as UserRole,
  COORDINADOR: 'coordinador' as UserRole,
} as const;

/**
 * Nombres legibles de los roles
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  estudiante: 'Estudiante',
  maestro: 'Maestro',
  coordinador: 'Coordinador',
};

