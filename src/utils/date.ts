/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha a formato legible en español
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formatea una fecha con hora
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Verifica si una fecha está próxima (dentro de X días)
 */
export const isDateNear = (dateString: string, days: number = 3): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};

/**
 * Verifica si una fecha ya pasó
 */
export const isDatePast = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getTime() < now.getTime();
};

