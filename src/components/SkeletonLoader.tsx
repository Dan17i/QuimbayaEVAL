import React from 'react';
import { cn } from './ui/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Componente Skeleton para loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton para tarjetas de estadísticas
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" variant="text" />
          <Skeleton className="h-8 w-16" variant="text" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" variant="circular" />
      </div>
    </div>
  );
};

/**
 * Skeleton para filas de tabla
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" variant="text" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton para cards de evaluación
 */
export const EvaluacionCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" variant="text" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" variant="rectangular" />
            <Skeleton className="h-6 w-24 rounded-full" variant="rectangular" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" variant="rectangular" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
      </div>
    </div>
  );
};

/**
 * Skeleton para listas de cursos
 */
export const CursoCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" variant="text" />
          <Skeleton className="h-4 w-1/2" variant="text" />
        </div>
        <Skeleton className="h-8 w-24" variant="rectangular" />
      </div>
      <Skeleton className="h-4 w-full" variant="text" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
      </div>
      <Skeleton className="h-2 w-full" variant="rectangular" />
    </div>
  );
};

