import React from 'react';
import { Card, CardContent } from './ui/card';
import { Estadistica } from '../types';

interface StatCardProps {
  stat: Estadistica;
}

/**
 * Componente reutilizable para mostrar estadísticas
 */
export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const Icon = stat.icon;

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.label}</p>
            <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{stat.value}</p>
          </div>
          <div className={`${stat.bg} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

