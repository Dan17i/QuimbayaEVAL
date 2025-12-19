import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';
import { EstadoEvaluacion, EstadoPQRS } from '../types';

interface StatusBadgeProps {
  estado: EstadoEvaluacion | EstadoPQRS;
  showIcon?: boolean;
}

/**
 * Componente para mostrar badges de estado con iconos
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, showIcon = true }) => {
  const getConfig = () => {
    switch (estado) {
      case 'Activa':
      case 'Pendiente':
        return {
          variant: 'warning' as const,
          icon: Clock,
          label: estado,
        };
      case 'Cerrada':
      case 'Resuelto':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: estado,
        };
      case 'Programada':
      case 'En Proceso':
        return {
          variant: 'info' as const,
          icon: AlertCircle,
          label: estado,
        };
      case 'Borrador':
        return {
          variant: 'default' as const,
          icon: AlertCircle,
          label: estado,
        };
      default:
        return {
          variant: 'default' as const,
          icon: Clock,
          label: estado,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

