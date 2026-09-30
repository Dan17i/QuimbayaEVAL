import { PQRSDetalle } from '../services/pqrsService';
import { EstadoSLA } from '../types';

export interface MetricasSLA {
  total: number;
  pendientes: PQRSDetalle[];
  vencidas: PQRSDetalle[];
  proximas: PQRSDetalle[];
  atendidas: PQRSDetalle[];
  atendidasATiempo: PQRSDetalle[];
  cumplimientoPct: number;
  urgentes: PQRSDetalle[];
}

export const SLA_DIAS_LIMITE = 15;

/**
 * Determina el estado legal SLA según los días transcurridos y si ya fue resuelto
 */
export const calcularEstadoSLA = (
  diasTranscurridos: number,
  resuelto: boolean,
  limiteDias: number = SLA_DIAS_LIMITE
): EstadoSLA => {
  if (resuelto) {
    return diasTranscurridos <= limiteDias ? 'ATENDIDO_A_TIEMPO' : 'ATENDIDO_FUERA_DE_PLAZO';
  }
  if (diasTranscurridos > limiteDias) {
    return 'VENCIDO';
  }
  if (diasTranscurridos >= limiteDias - 3) {
    return 'PROXIMO_A_VENCER';
  }
  return 'A_TIEMPO';
};

/**
 * Calcula las métricas institucionales de cumplimiento del SLA de 15 días
 */
export const calcularMetricasSLA = (pqrsDetalles: PQRSDetalle[]): MetricasSLA => {
  const total = pqrsDetalles.length;
  const pendientes = pqrsDetalles.filter(p => p.estado === 'Pendiente' || p.estado === 'En Proceso');
  const vencidas = pqrsDetalles.filter(p => p.estadoSLA === 'VENCIDO');
  const proximas = pqrsDetalles.filter(p => p.estadoSLA === 'PROXIMO_A_VENCER');
  const atendidas = pqrsDetalles.filter(p => p.estado === 'Resuelta' || p.estado === 'Cerrada');
  const atendidasATiempo = pqrsDetalles.filter(p => p.estadoSLA === 'ATENDIDO_A_TIEMPO');

  const cumplimientoPct = total > 0
    ? Math.round(((total - vencidas.length) / total) * 100)
    : 100;

  const urgentes = [...vencidas, ...proximas];

  return {
    total,
    pendientes,
    vencidas,
    proximas,
    atendidas,
    atendidasATiempo,
    cumplimientoPct,
    urgentes,
  };
};

/**
 * Obtiene la configuración visual del badge según el estado SLA
 */
export const getSLABadgeInfo = (estadoSLA?: EstadoSLA) => {
  switch (estadoSLA) {
    case 'VENCIDO':
      return {
        label: 'Vencido (> 15 días)',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
        urgente: true,
      };
    case 'PROXIMO_A_VENCER':
      return {
        label: 'Por vencer (≤ 3 días)',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        urgente: true,
      };
    case 'ATENDIDO_A_TIEMPO':
      return {
        label: 'Atendido a tiempo',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        urgente: false,
      };
    case 'ATENDIDO_FUERA_DE_PLAZO':
      return {
        label: 'Atendido fuera de plazo',
        badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        urgente: false,
      };
    case 'A_TIEMPO':
    default:
      return {
        label: 'En término',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        urgente: false,
      };
  }
};
