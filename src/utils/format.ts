/**
 * Utilidades para formateo de datos
 */

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num);
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatea una calificación (ej: 4.5/5.0)
 */
export const formatCalificacion = (obtenido: number, maximo: number = 5.0): string => {
  return `${obtenido.toFixed(1)}/${maximo.toFixed(1)}`;
};

/**
 * Formatea un rango de fechas
 */
export const formatDateRange = (fechaInicio: string, fechaFin: string): string => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const inicioStr = inicio.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const finStr = fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return `${inicioStr} - ${finStr}`;
};

/**
 * Formatea duración en minutos a formato legible
 */
export const formatDuracion = (minutos: number): string => {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

/**
 * Formatea un número grande (ej: 2847 -> 2.8K)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

