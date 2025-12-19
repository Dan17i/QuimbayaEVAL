/**
 * Utilidades de validación
 */

/**
 * Valida un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida una contraseña (mínimo 6 caracteres)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Valida que un campo no esté vacío
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

